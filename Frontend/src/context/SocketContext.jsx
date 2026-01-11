import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('register', user.id);
      });

      newSocket.on('hired', (data) => {
        setNotifications(prev => [...prev, data]);
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('GigFlow', {
            body: data.message,
            icon: '/logo.png'
          });
        }
      });

      return () => newSocket.close();
    }
  }, [user]);

  const clearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotification }}>
      {children}
    </SocketContext.Provider>
  );
};