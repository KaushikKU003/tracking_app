import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://track-1-y9sd.onrender.com'); // Update with your deployed server URL

function App() {
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    // Listen for horn notification
    socket.on('notifyHorn', () => {
      setNotification(true);
      setTimeout(() => setNotification(false), 3000); // Reset after 3 seconds
    });

    return () => socket.off('notifyHorn');
  }, []);

  const handleHornClick = () => {
    socket.emit('horn'); // Notify the server
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Horn Notification App</h1>
      <button onClick={handleHornClick} style={styles.button}>Horn</button>
      {notification && <p style={styles.notification}>Horn clicked on another device!</p>}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5d547',
    color: '#7e8287',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#7e8287',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#5a5d60',
  },
  notification: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'red',
  },
};

export default App;
