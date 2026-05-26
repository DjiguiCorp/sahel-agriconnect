import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { WS_BASE_URL } from '../config/api';

const MAX_REALTIME_UPDATES = 50;
const MAX_RECONNECT_ATTEMPTS = 5;

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

function appendUpdate(prev, entry) {
  const next = [...prev, entry];
  return next.length > MAX_REALTIME_UPDATES ? next.slice(-MAX_REALTIME_UPDATES) : next;
}

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [reconnectExhausted, setReconnectExhausted] = useState(false);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    reconnectAttemptsRef.current = 0;
    setReconnectExhausted(false);

    const newSocket = io(WS_BASE_URL || undefined, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      randomizationFactor: 0.4,
    });

    newSocket.on('connect', () => {
      reconnectAttemptsRef.current = 0;
      setReconnectExhausted(false);
      if (import.meta.env.DEV) console.log('WebSocket connecté');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      if (import.meta.env.DEV) console.log('WebSocket déconnecté');
      setIsConnected(false);
    });

    newSocket.on('farmer:registered', (data) => {
      if (import.meta.env.DEV) console.log('Nouvel agriculteur enregistré:', data);
      setFarmers((prev) => [...prev, data]);
      setRealTimeUpdates((prev) =>
        appendUpdate(prev, {
          type: 'farmer_registered',
          data,
          timestamp: new Date(),
        })
      );
    });

    newSocket.on('farmer:updated', (data) => {
      if (import.meta.env.DEV) console.log('Agriculteur mis à jour:', data);
      setFarmers((prev) => prev.map((f) => f.id === data.id ? data : f));
      setRealTimeUpdates((prev) =>
        appendUpdate(prev, {
          type: 'farmer_updated',
          data,
          timestamp: new Date(),
        })
      );
    });

    newSocket.on('connect_error', (error) => {
      reconnectAttemptsRef.current += 1;
      if (import.meta.env.DEV) {
        console.warn('Erreur de connexion WebSocket:', error.message);
      }
      setIsConnected(false);
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setReconnectExhausted(true);
        newSocket.disconnect();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  const emitFarmerRegistration = useCallback(
    (farmerData) => {
      if (socket && isConnected) {
        socket.emit('farmer:register', farmerData);
      } else if (import.meta.env.DEV) {
        console.log('Mode simulation : agriculteur ajouté localement');
        setFarmers((prev) => [...prev, farmerData]);
      }
    },
    [socket, isConnected]
  );

  const emitFarmerUpdate = useCallback(
    (farmerData) => {
      if (socket && isConnected) {
        socket.emit('farmer:update', farmerData);
      } else {
        setFarmers((prev) => prev.map((f) => (f.id === farmerData.id ? farmerData : f)));
      }
    },
    [socket, isConnected]
  );

  const removeFarmerFromList = useCallback((farmerId) => {
    if (!farmerId) return;
    setFarmers((prev) => prev.filter((f) => String(f.id || f._id || '') !== String(farmerId)));
  }, []);

  const clearUpdates = useCallback(() => setRealTimeUpdates([]), []);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      reconnectExhausted,
      farmers,
      realTimeUpdates,
      emitFarmerRegistration,
      emitFarmerUpdate,
      removeFarmerFromList,
      clearUpdates,
    }),
    [
      socket,
      isConnected,
      reconnectExhausted,
      farmers,
      realTimeUpdates,
      emitFarmerRegistration,
      emitFarmerUpdate,
      removeFarmerFromList,
      clearUpdates,
    ]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
