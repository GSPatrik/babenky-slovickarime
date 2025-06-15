const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/createJoin.html');
});

app.use(express.static(path.join(__dirname, "public")));


const rooms = {}; // { roomCode: { users: [{id, name}], turnIndex, started, admin, storyName } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create room", ({ username, storyName }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomCode] = {
      users: [{ id: socket.id, name: username }],
      turnIndex: 0,
      started: false,
      admin: username,
      storyName: storyName,
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    socket.emit("room created", { roomCode, storyName });
    io.to(roomCode).emit("user list", rooms[roomCode].users.map(u => u.name));
    io.to(roomCode).emit("room info", { admin: username });
    
    // První hráč má hned turn
    io.to(socket.id).emit("your turn");
  });

  socket.on("join room", ({ username, roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("room not found");
      return;
    }
    if (room.started) {
      socket.emit("join denied", "Game already started.");
      return;
    }

    room.users.push({ id: socket.id, name: username });
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    io.to(roomCode).emit("user list", room.users.map(u => u.name));
    io.to(roomCode).emit("room info", { admin: room.admin });
    socket.emit("joined", { roomCode, storyName: room.storyName });

    // Po připojení nového hráče mu pošli čekací stav
    socket.emit("wait turn");
  });

  function updateTurns(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const currentTurnUser = room.users[room.turnIndex];
    if (!currentTurnUser) return;

    room.users.forEach((user) => {
      if (user.id === currentTurnUser.id) {
        io.to(user.id).emit("your turn");
      } else {
        io.to(user.id).emit("wait turn");
      }
    });
  }

  socket.on("start game", () => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    room.started = true;
    io.to(roomCode).emit("redirect to game");

    updateTurns(roomCode);
  });

  socket.on("chat message", (msg) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    io.to(roomCode).emit("chat message", {
      username: socket.username,
      message: msg
    });

    // posuň ťah na dalšího hráče
    room.turnIndex = (room.turnIndex + 1) % room.users.length;
    updateTurns(roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    room.users = room.users.filter(u => u.id !== socket.id);

    // pokud odešel hráč, co byl na tahu, resetuj index, pokud je mimo rozsah
    if (room.turnIndex >= room.users.length) {
      room.turnIndex = 0;
    }

    if (room.users.length === 0) {
      delete rooms[roomCode];
    } else {
      io.to(roomCode).emit("user list", room.users.map(u => u.name));
      updateTurns(roomCode);
    }
  });
});

server.listen(3000, () => {
  console.log("Server beží na http://localhost:3000");
});
