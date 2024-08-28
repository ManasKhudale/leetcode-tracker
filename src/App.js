import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [hoveredUser, setHoveredUser] = useState(null);

  // Retrieve users from localStorage when the app loads
  useEffect(() => {
    const storedUsers = localStorage.getItem('leetcodeUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Store users in localStorage whenever the users state changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('leetcodeUsers', JSON.stringify(users));
    }
  }, [users]);

  // Function to fetch data for all users, wrapped with useCallback to avoid unnecessary re-creation
  const fetchAllUsersData = useCallback(async () => {
    const updatedUsers = await Promise.all(users.map(async (user) => {
      try {
        const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${user.username}`);
        const data = await response.json();
        if (data.status === 'success') {
          return { ...user, ...data };
        }
      } catch (error) {
        console.error(`Error fetching data for ${user.username}:`, error);
      }
      return user; // Return the original user if fetching fails
    }));

    setUsers(updatedUsers);
  }, [users]);

  // Set up polling every 10 minutes (600,000 ms)
  useEffect(() => {
    if (users.length > 0) {
      const interval = setInterval(fetchAllUsersData, 600000); // 10 minutes
      return () => clearInterval(interval); // Clean up interval on component unmount
    }
  }, [users, fetchAllUsersData]);

  // Function to fetch user data for a new username
  const fetchUserData = async () => {
    if (!username) {
      alert('Please enter a username.');
      return;
    }
  
    try {
      const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
      const data = await response.json();
  
      if (data.status === 'success') {
        // Check if the user already exists in the list
        if (users.some(user => user.username === username)) {
          alert('User already exists in the list.');
        } else {
          setUsers([...users, { username, ...data }]);
        }
        setUsername(''); // Clear the input after adding
      } else if (data.message) {
        alert(data.message); // If there's a specific error message from the API
      } else {
        alert('An error occurred while fetching the user data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('An error occurred while fetching the user data. Please check your network connection or try again later.');
    }
  };
  

  const handleHover = (user) => {
    setHoveredUser(user);
  };

  const handleMouseLeave = () => {
    setHoveredUser(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      fetchUserData();
    }
  };

  const deleteUser = (username) => {
    const updatedUsers = users.filter(user => user.username !== username);
    setUsers(updatedUsers);
  };

  return (
    <div className="external">
      <nav className="navbar">
        <h3>LeetCode Following List</h3>
      </nav>
      <div className="body-container">
        <div className="header-container">
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="Enter LeetCode username"
            className="input-text"
          />
          <button className="add-user" onClick={fetchUserData}> + </button>
        </div>
        <h4>Following List :</h4> 
        <ul>
          {users.map((user, index) => (
            <li 
              key={index}
              className="user-item"
              onMouseEnter={() => handleHover(user)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="user-info" >
                {index + 1}. <a href={`https://leetcode.com/u/${user.username}`} target="_blank" rel="noopener noreferrer" style={{color:'white',textDecoration:'none'}}>{user.username}</a>
              </div>
              {hoveredUser && hoveredUser.username === user.username && (
                <>
                  <div className="tooltip">
                    <p>Total Solved: {user.totalSolved}/{user.totalQuestions}</p>
                    <p>Easy Solved: {user.easySolved}/{user.totalEasy}</p>
                    <p>Medium Solved: {user.mediumSolved}/{user.totalMedium}</p>
                    <p>Hard Solved: {user.hardSolved}/{user.totalHard}</p>
                  </div>
                  <button className="delete-user" onClick={() => deleteUser(user.username)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
