import React, { useEffect } from 'https://cdn.skypack.dev/react';

import socket from '../../socket.jsx';

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const CANVAS_BACKGROUND_COLOR = '#ecf0f1';
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const PLAYER_COLOR = '#c0392b';

const style = {
  border: "1px solid #d3d3d3"
}

const initializeCanvas = ({ room, username }) => {
  const canvasElement = document.getElementById("canvas-area");
  const context = canvasElement.getContext("2d");

  document.addEventListener('keydown', event => {
    if (event.code === 'Space') {
      socket.emit('send-player-input', {
        room,
        username: username || socket.id,
        input: 'space'
      });
    }
  })

  const drawBackground = () => {
    context.fillStyle = CANVAS_BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const drawPlayers = players => {
    players.forEach(player => {
      context.fillStyle = player.color;
      context.fillRect(
        player.x,
        player.y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT
      );
    });
  }

  const render = () => {
    drawBackground();
    drawPlayers();
  }

  socket.emit('start-game', { room });

  socket.on('update-player-positions', ({ players }) => {
    drawBackground();
    drawPlayers(players);
  })
}

const GameCanvas = ({ room, username }) => {
  useEffect(() => initializeCanvas({ room, socket, username }), [socket]);

  return (
    <div id="canvas-root">
      <canvas
        id="canvas-area"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={style}
      >
        Your browser does not support the HTML canvas tag.
      </canvas>
    </div>
  );
}

export default GameCanvas;
