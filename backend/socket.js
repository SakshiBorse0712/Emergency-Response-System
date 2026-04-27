import { Server } from 'socket.io';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // For development, allow all origins
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room based on user ID or role
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User with ID: ${socket.id} joined room: ${room}`);
    });

    // Ambulance emitting live location
    socket.on('ambulance_location_update', (data) => {
      // Broadcast to the specific emergency room (patient + admin)
      // data should contain { emergencyId, location: { lng, lat } }
      io.to(data.emergencyId).emit('receive_ambulance_location', data);
    });

    // Emergency status update broadcast
    socket.on('emergency_status_update', (data) => {
      io.to(data.emergencyId).emit('receive_status_update', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
    });
  });

  return io;
};

export default setupSocket;
