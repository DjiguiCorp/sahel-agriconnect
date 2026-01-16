import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { WS_BASE_URL } from '../config/api';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);

  useEffect(() => {
    // Connexion WebSocket au backend
    const newSocket = io(WS_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      if (import.meta.env.DEV) console.log('WebSocket connecté');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      if (import.meta.env.DEV) console.log('WebSocket déconnecté');
      setIsConnected(false);
    });

    // Écouter les mises à jour d'agriculteurs
    newSocket.on('farmer:registered', (data) => {
      if (import.meta.env.DEV) console.log('Nouvel agriculteur enregistré:', data);
      setFarmers(prev => [...prev, data]);
      setRealTimeUpdates(prev => [...prev, {
        type: 'farmer_registered',
        data,
        timestamp: new Date()
      }]);
    });

    newSocket.on('farmer:updated', (data) => {
      if (import.meta.env.DEV) console.log('Agriculteur mis à jour:', data);
      setFarmers(prev => prev.map(f => f.id === data.id ? data : f));
      setRealTimeUpdates(prev => [...prev, {
        type: 'farmer_updated',
        data,
        timestamp: new Date()
      }]);
    });

    // Gérer les erreurs de connexion
    newSocket.on('connect_error', (error) => {
      if (import.meta.env.DEV) console.warn('Erreur de connexion WebSocket:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const emitFarmerRegistration = (farmerData) => {
    if (socket && isConnected) {
      socket.emit('farmer:register', farmerData);
    } else {
      // Mode simulation : ajouter directement à la liste locale
      if (import.meta.env.DEV) console.log('Mode simulation : agriculteur ajouté localement');
      setFarmers(prev => [...prev, farmerData]);
    }
  };

  const emitFarmerUpdate = (farmerData) => {
    if (socket && isConnected) {
      socket.emit('farmer:update', farmerData);
    } else {
      // Mode simulation
      setFarmers(prev => prev.map(f => f.id === farmerData.id ? farmerData : f));
    }
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      farmers,
      realTimeUpdates,
      emitFarmerRegistration,
      emitFarmerUpdate,
      clearUpdates: () => setRealTimeUpdates([])
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

