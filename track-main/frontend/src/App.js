import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const socket = io('https://track-1-y9sd.onrender.com');

function App() {
  const [notification, setNotification] = useState(null);
  const [userLocation, setUserLocation] = useState([0, 0]);
  const [evLocation, setEvLocation] = useState([0, 0]);
  const [distance, setDistance] = useState(0);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const evMarkerRef = useRef(null);

  // Ambulance icon
  const ambulanceIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/13.0.1/72x72/1f691.png', // Ambulance emoji URL
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  // Car icon
  const carIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/13.0.1/72x72/1f697.png', // Car emoji URL
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  useEffect(() => {
    socket.on('notifyHorn', () => {
      setNotification('Ambulance is near!');
      setTimeout(() => setNotification(null), 3000);
    });

    return () => socket.off('notifyHorn');
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setEvLocation([latitude + 0.001, longitude + 0.001]); // Place EV (car) slightly away from the user
      });
    }
  }, []);

  useEffect(() => {
    if (userLocation[0] !== 0 && userLocation[1] !== 0 && !mapRef.current) {
      mapRef.current = L.map('map').setView(userLocation, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add ambulance marker (user)
      userMarkerRef.current = L.marker(userLocation, {
        icon: ambulanceIcon,
        draggable: true,
      })
        .addTo(mapRef.current)
        .bindPopup('Ambulance Location')
        .openPopup();

      // Add car marker (EV)
      evMarkerRef.current = L.marker(evLocation, {
        icon: carIcon,
        draggable: true,
      })
        .addTo(mapRef.current)
        .bindPopup('Car Location')
        .openPopup();

      // Update ambulance location on drag
      userMarkerRef.current.on('dragend', (e) => {
        const newPosition = e.target.getLatLng();
        setUserLocation([newPosition.lat, newPosition.lng]);
        updateDistance(newPosition, evMarkerRef.current.getLatLng());
      });

      // Update car location on drag
      evMarkerRef.current.on('dragend', (e) => {
        const newPosition = e.target.getLatLng();
        setEvLocation([newPosition.lat, newPosition.lng]);
        updateDistance(userMarkerRef.current.getLatLng(), newPosition);
      });
    }
  }, [userLocation, evLocation]);

  const updateDistance = (userLatLng, evLatLng) => {
    const distance = getDistanceFromLatLonInMeters(
      userLatLng.lat,
      userLatLng.lng,
      evLatLng.lat,
      evLatLng.lng
    );
    setDistance(distance.toFixed(2)); // Set distance with two decimal places
    if (distance < 500) {
      socket.emit('horn');
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Ambulance & Car Notification</h1>
      {notification && <p style={styles.notification}>{notification}</p>}
      <p style={styles.distance}>Distance between Ambulance and Car: {distance} meters</p>
      <div id="map" style={styles.map}></div>
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
    color: '#333',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: '20px',
  },
  notification: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'red',
  },
  distance: {
    marginTop: '10px',
    fontSize: '16px',
    color: '#333',
  },
  map: {
    width: '100%',
    height: '400px',
    marginTop: '20px',
  },
};

export default App;