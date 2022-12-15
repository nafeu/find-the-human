const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const PLAYER_HEIGHT = 20;
const FAKE_PLAYER_COUNT = 5;

let rooms = {}

const getRandomPlayerColor = () => `#${Math.floor(Math.random()*16777215).toString(16)}`;

const getDefaultPlayerConfig = ({ username, socketId, defaultX, defaultY }) => ({
  username,
  socketId,
  x: defaultX || 0,
  y: defaultY || 0,
  color: getRandomPlayerColor()
})

const getRoomWithFakePlayersInserted = ({ room, count }) => {
  output = { ...room };

  for (let i = 0; i < count; i++) {
    const playerConfig = getDefaultPlayerConfig({
      username: `bot-${i}`,
      socketId: `bot-${i}`,
      defaultY: (i + 1) * PLAYER_HEIGHT
    })

    output.players.push(playerConfig)
  }

  return output;
}

app.use(cors());

app.get('/api', (req, res) => {
  res.json({ message: 'success' })
});

io.on('connection', (socket) => {
  console.log(`[ server.js ] ${socket.id} connected`);

  socket.on('join', ({ roomCode, username }) => {
    socket.join(roomCode);

    const roomDoesNotExist = !rooms[roomCode];

    console.log({ roomDoesNotExist, rooms, roomCode })

    const userObject = getDefaultPlayerConfig({ username, socketId: socket.id });

    if (roomDoesNotExist) {
      rooms[roomCode] = { players: [userObject] }

      rooms[roomCode] = getRoomWithFakePlayersInserted({ room: rooms[roomCode], count: FAKE_PLAYER_COUNT });
    } else {
      rooms[roomCode].players.push({ ...userObject, y: rooms[roomCode].players.length * PLAYER_HEIGHT });
    }

    socket.emit('join-room', { roomCode, username });
    io.to(roomCode).emit('update-active-users', { username });
  });

  socket.on('disconnect', () => {
    console.log(`[ server.js ] ${socket.id} disconnected`);
  });

  socket.on('send-message', ({ room, message, username }) => {
    io.to(room).emit('receive-message', { message, username });
  })

  socket.on('start-game', ({ room }) => {
    io.to(room).emit('update-player-positions', { players: rooms[room].players });
  })

  socket.on('send-player-input', ({ room, username, input }) => {
    console.log(`< send-player-input:${Date.now()} > ${username} sent ${input}`)

    if (input === 'space') {
      rooms[room] = {
        ...rooms[room],
        players: rooms[room].players.map(player => {
          const isMatchingUserFromInput = player.socketId === socket.id;

          if (isMatchingUserFromInput) {
            return {
              ...player,
              x: player.x + 10
            }
          }

          return player;
        })
      }

      io.to(room).emit('update-player-positions', { players: rooms[room].players });
    }
  })
});

server.listen(process.env.PORT || 8000, () => {
  console.log(`[ server.js ] Websocket server running on port ${server.address().port}`);
});
