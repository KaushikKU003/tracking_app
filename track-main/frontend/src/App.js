import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const socket = io('https://track-1-y9sd.onrender.com'); // Replace with your server URL

function App() {
  const [notification, setNotification] = useState(null);
  const [distance, setDistance] = useState(0);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const evMarkerRef = useRef(null);

  const ambulanceIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/13.0.1/72x72/1f691.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  const carIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/13.0.1/72x72/1f697.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  const getDistanceFromLatLonInMeters = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  const updateDistance = useCallback((userLatLng, evLatLng) => {
    if (userLatLng && evLatLng) {
      const distance = getDistanceFromLatLonInMeters(
        userLatLng.lat,
        userLatLng.lng,
        evLatLng.lat,
        evLatLng.lng
      );
      setDistance(distance.toFixed(2));

      if (distance < 500) {
        socket.emit('horn');
      }

      socket.emit('distanceUpdate', { distance: distance.toFixed(2) });
    }
  }, [getDistanceFromLatLonInMeters]);

  useEffect(() => {
    socket.on('notifyHorn', () => {
      setNotification('Ambulance is near!');
      setTimeout(() => setNotification(null), 9000);
    });

    socket.on('updateLocation', (data) => {
      if (data.type === 'ambulance' && userMarkerRef.current) {
        userMarkerRef.current.setLatLng(data.location);
      } else if (data.type === 'car' && evMarkerRef.current) {
        evMarkerRef.current.setLatLng(data.location);
      }

      const userLatLng = userMarkerRef.current?.getLatLng();
      const evLatLng = evMarkerRef.current?.getLatLng();
      updateDistance(userLatLng, evLatLng);
    });

    socket.on('updateDistance', (newDistance) => {
      setDistance(newDistance);
    });

    return () => {
      socket.off('notifyHorn');
      socket.off('updateLocation');
      socket.off('updateDistance');
    };
  }, [updateDistance]);

  useEffect(() => {
    if (!mapRef.current) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current = L.map('map').setView([latitude, longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Add ambulance marker
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: ambulanceIcon,
          draggable: true,
        })
          .addTo(mapRef.current)
          .bindPopup('Ambulance Location')
          .openPopup();

        // Add car marker
        evMarkerRef.current = L.marker([latitude + 0.001, longitude + 0.001], {
          icon: carIcon,
          draggable: true,
        })
          .addTo(mapRef.current)
          .bindPopup('Car Location')
          .openPopup();

        // Emit location updates
        userMarkerRef.current.on('dragend', (e) => {
          const newPosition = e.target.getLatLng();
          socket.emit('locationUpdate', { type: 'ambulance', location: newPosition });
        });

        evMarkerRef.current.on('dragend', (e) => {
          const newPosition = e.target.getLatLng();
          socket.emit('locationUpdate', { type: 'car', location: newPosition });
        });

        // Initial distance calculation
        updateDistance(
          userMarkerRef.current.getLatLng(),
          evMarkerRef.current.getLatLng()
        );
      });
    }
  }, [ambulanceIcon, carIcon, updateDistance]);

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