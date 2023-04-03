const express = require("express");
const app = express();
const socketIo = require("socket.io");
const server = require("http").createServer(app);
const ExpressPeerServer = require("peer").ExpressPeerServer;

app.use(
  "/peerjs",
  ExpressPeerServer(server, {
    debug: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", function (socket) {
  socket.on("join", function (data) {
    console.log("User joined " + data);
    socket.join(data);
  });

  socket.on("remoteconnect", ({ userInfo, remoteId }) => {
    if (!io.sockets.adapter.rooms.has(remoteId)) {
      socket.emit('remotenotexist');
      return;
    }
    io.to(remoteId).emit("remoteconnect", userInfo);
  });

  socket.on("remoteconnect_error", (remoteId) => {
    io.to(remoteId).emit("remoteconnect_error");
  });

  socket.on('remoteisconnected', remoteId => {
    io.to(remoteId).emit('remoteisconnected');
  });

  socket.on('remotetimeout', remoteId => {
    io.to(remoteId).emit('remotetimeout');
  });

  socket.on("remoteconnected", ({ remoteId, startTime }) => {
    io.to(remoteId).emit("remoteconnected", startTime);
  });

  socket.on("remotedisconnected", (remoteId) => {
    io.to(remoteId).emit("remotedisconnected");
  });

  socket.on("mouseclick", ({ remoteId, data }) => {
    io.to(remoteId).emit("mouseclick", data);
  });

  socket.on("scroll", ({ remoteId, data }) => {
    console.log(data);
    io.to(remoteId).emit("scroll", data);
  });

  socket.on("keydown", ({ remoteId, data }) => {
    console.log(data);
    io.to(remoteId).emit("keydown", data);
  });
});

server.listen(8010, () => {
  console.log("Server started");
});