const express = require('express');
const app = express();
const socketIo = require('socket.io');
const server = require('http').createServer(app);
const ExpressPeerServer = require('peer').ExpressPeerServer;
import { Socket } from 'socket.io';

app.use(
  '/peerjs',
  ExpressPeerServer(server, {
    debug: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// 映射socket-id和ID
const userMap = new Map<string, string>();
// 映射连接关系
const connectionMap = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  socket.on('join', function (id) {
    console.log('User joined ' + id);
    userMap.set(socket.id, id);
    socket.join(id);
  });

  socket.on('disconnect', () => {
    const userId = userMap.get(socket.id)!;
    console.log('disconnect', userId);
    if (connectionMap.has(userId)) {
      const remoteId = connectionMap.get(userId)!;
      io.to(remoteId).emit('remotedisconnect');
      connectionMap.delete(userId);
      connectionMap.delete(remoteId);
    }
    userMap.delete(socket.id);
    socket.rooms.forEach(room => {
      console.log('User leave' + room);
      socket.leave(room);
    });
  });

  socket.on('remoteconnect', ({ userInfo, remoteId }) => {
    if (!io.sockets.adapter.rooms.has(remoteId)) {
      socket.emit('remotenotexist');
      return;
    }
    io.to(remoteId).emit('remoteconnect', userInfo);
  });

  socket.on('remoteconnect_error', (remoteId: string) => {
    io.to(remoteId).emit('remoteconnect_error');
  });

  socket.on('remoteisconnected', (remoteId: string) => {
    io.to(remoteId).emit('remoteisconnected');
  });

  socket.on('remotetimeout', (remoteId: string) => {
    io.to(remoteId).emit('remotetimeout');
  });

  socket.on('remoteconnected', ({ remoteId, startTime }) => {
    io.to(remoteId).emit('remoteconnected', startTime);
    connectionMap.set(remoteId, userMap.get(socket.id)!);
    connectionMap.set(userMap.get(socket.id)!, remoteId);
  });

  socket.on('remotedisconnect', (remoteId: string) => {
    connectionMap.delete(remoteId);
    connectionMap.delete(userMap.get(socket.id)!);
    io.to(remoteId).emit('remotedisconnect');
  });

  socket.on('mouse', ({ remoteId, data }) => {
    io.to(remoteId).emit('mouse', data);
  });

  socket.on('scroll', ({ remoteId, data }) => {
    console.log(data);
    io.to(remoteId).emit('scroll', data);
  });

  socket.on('key', ({ remoteId, data }) => {
    console.log(data);
    io.to(remoteId).emit('key', data);
  });
});

server.listen(8010, () => {
  console.log('Server started');
});