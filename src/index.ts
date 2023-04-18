const express = require('express');
const app = express();
const socketIo = require('socket.io');
const server = require('http').createServer(app);
const ExpressPeerServer = require('peer').ExpressPeerServer;
import { Socket } from 'socket.io';
import { IKeyData, IMouseData, IScrollData, IUserInfo } from './type';

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

// 映射连接关系
const connectionMap = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  let userId = '';
  socket.on('join', function (id) {
    console.log('User joined ' + id);
    userId = id;
    socket.join(id);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', userId);
    if (connectionMap.has(userId)) {
      const remoteId = connectionMap.get(userId)!;
      io.to(remoteId).emit('remotedisconnect');
      connectionMap.delete(userId);
      connectionMap.delete(remoteId);
    }
    socket.rooms.forEach(room => {
      console.log('User leave' + room);
      socket.leave(room);
    });
  });

  socket.on('remoteconnect', ({ remoteId, userInfo }: { remoteId: string, userInfo: IUserInfo }) => {
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

  socket.on('remoteconnected', ({ remoteId, startTime }: { remoteId: string, startTime: number }) => {
    io.to(remoteId).emit('remoteconnected', startTime);
    connectionMap.set(remoteId, userId);
    connectionMap.set(userId, remoteId);
  });

  socket.on('remotedisconnect', () => {
    const remoteId= connectionMap.get(userId)!;
    connectionMap.delete(remoteId);
    connectionMap.delete(userId);
    io.to(remoteId).emit('remotedisconnect');
  });

  socket.on('mouse', (data: IMouseData) => {
    const remoteId= connectionMap.get(userId)!;
    io.to(remoteId).emit('mouse', data);
  });

  socket.on('scroll', (data: IScrollData) => {
    const remoteId= connectionMap.get(userId)!;
    io.to(remoteId).emit('scroll', data);
  });

  socket.on('key', (data: IKeyData) => {
    const remoteId= connectionMap.get(userId)!;
    io.to(remoteId).emit('key', data);
  });
});

const port = process.env.PORT ?? 8010;

server.listen(port, () => {
  console.log('Server started');
});