import { ref, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import config from '@/config';

export const useSocket = () => {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const error = ref<string | null>(null);

  const connect = () => {
    try {
      // Connect to WebSocket server
      socket.value = io(config.SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
      });

      // Setup event handlers
      socket.value.on('connect', () => {
        console.log('WebSocket connected');
        isConnected.value = true;
        error.value = null;
      });

      socket.value.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        isConnected.value = false;
      });

      socket.value.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        error.value = 'Failed to connect to server';
        isConnected.value = false;
      });

    } catch (err) {
      console.error('Error initializing socket:', err);
      error.value = 'Failed to initialize WebSocket connection';
    }
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  // Automatically disconnect when component is unmounted
  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect
  };
};