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


const rooms = {}; // { roomCode: { users: [], turnIndex: 0 } }

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("join room", ({ username, roomCode }) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { users: [], turnIndex: 0, storyName: "Default Story" };
    }

    const room = rooms[roomCode];


    if (!room) {
      socket.emit("room not found");
      return;
    }


    if (!room.users.some(u => u.id === socket.id)) {
      room.users.push({ id: socket.id, name: username });
    }

    // console.log(room)

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    // console.log(`${username} joined room ${roomCode}`);

    io.to(roomCode).emit("user list", room.users.map(u => u.name));
    socket.emit("joined", { roomCode, storyName: room.storyName });

    // ak je prvý, daj mu ťah
    if (room.users.length === 1) {
      io.to(room.users[0].id).emit("your turn");
    } else {
      socket.emit("wait turn");
    }
  });

  socket.on("chat message", (msg) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    // Skontroluj, či je tento hráč na rade
    const currentPlayer = room.users[room.turnIndex];
      // console.log(currentPlayer);
      socket.emit("wait turn");

    if (!currentPlayer || currentPlayer.id !== socket.id) {
      // Nie je na rade, správu ignoruj alebo pošli späť správu
      return;
    }

    io.to(roomCode).emit("chat message", {
      username: socket.username,
      message: msg
    });

    // Prepnúť turn len ak je viac ako jeden hráč
    if (room.users.length > 1) {
      // console.log(`Switching turn from ${currentPlayer.name}`);
      // Posuň index na ďalšieho hráča
      room.turnIndex = (room.turnIndex + 1) % room.users.length;
      const nextPlayer = room.users[room.turnIndex];
      // console.log(`Next player is ${nextPlayer.name}`);
      // console.log(room.users)

      // Nový hráč má ťah
      io.to(nextPlayer.id).emit("your turn");

      // Ostatní čakajú
      room.users.forEach((u, i) => {
        if (i !== room.turnIndex) {
          io.to(u.id).emit("wait turn");
        }
      });
    } else {
      // Ak je len jeden hráč, nech má stále svoj ťah
      io.to(room.users[0].id).emit("your turn");
    }
  });

  socket.on("create room", ({ username, storyName }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomCode] = {
      users: [{ id: socket.id, name: username }],
      turnIndex: 0,
      started: false,
      // admin: username,
      storyName: storyName,
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.username = username;

    socket.emit("room created", { roomCode, storyName });
    io.to(roomCode).emit("user list", rooms[roomCode].users.map(u => u.name));
    // io.to(roomCode).emit("room info", { admin: username });
    
    // První hráč má hned turn
    io.to(socket.id).emit("your turn");
  });

  // socket.on("join room", ({ username, roomCode }) => {
  //   const room = rooms[roomCode];
  //   if (!room) {
  //     socket.emit("room not found");
  //     return;
  //   }
  //   if (room.started) {
  //     socket.emit("join denied", "Game already started.");
  //     return;
  //   }

  //   room.users.push({ id: socket.id, name: username });
  //   socket.join(roomCode);
  //   socket.roomCode = roomCode;
  //   socket.username = username;

  //   io.to(roomCode).emit("user list", room.users.map(u => u.name));
  //   io.to(roomCode).emit("room info", { admin: room.admin });
  //   socket.emit("joined", { roomCode, storyName: room.storyName });

  //   // Po připojení nového hráče mu pošli čekací stav
  //   // socket.emit("wait turn");
  // });

  socket.on("start game", () => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    room.started = true;
    io.to(roomCode).emit("redirect to game");

    // updateTurns(roomCode);
  });

  socket.on("stop writing", () => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    console.log("stop writing", room);
    if (!room) return;

    // Only admin can stop writing
    // if (room.admin && socket.username === room.admin) {
      io.to(roomCode).emit("stop writing");
    // }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    room.users = room.users.filter(u => u.id !== socket.id);

    // ak bol na rade ten, kto odišiel
    if (room.turnIndex >= room.users.length) {
      room.turnIndex = 0;
    }

    if (room.users.length === 0) {
      delete rooms[roomCode];
    } else {
      io.to(roomCode).emit("user list", room.users.map(u => u.name));
      // pošleme novému hráčovi na rade že má turn
      const currentPlayer = room.users[room.turnIndex];
      io.to(currentPlayer.id).emit("your turn");
    }
  });
});

server.listen(3000, () => {
  console.log("Server beží na http://localhost:3000");
});
