import React, { useState, useEffect, useRef, Fragment } from 'https://cdn.skypack.dev/react';
import ReactDOM from 'https://cdn.skypack.dev/react-dom';

import GameCanvas from './components/GameCanvas';

import socket from './socket.jsx';

const App = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom]               = useState(null);
  const [username, setUsername]       = useState(null);
  const [messages, setMessages]       = useState([]);

  const roomInputRef = useRef();
  const usernameInputRef = useRef();
  const chatboxInputRef = useRef();

  const handleSocketConnect = () => {
    setIsConnected(true);
  }

  const handleSocketDisconnect = () => {
    setIsConnected(false);
  }

  const handleSocketJoinRoom = ({ roomCode, username }) => {
    setRoom(roomCode);
    setUsername(username);
  }

  const handleSocketUpdateActiveUsers = ({ username }) => {
    setMessages(currentMessages => [...currentMessages, {
      message: `${username} joined...`,
      username: '[ SYSTEM ]'
    }])
  }

  const handleSocketReceiveMessage = ({ message, username }) => {
    setMessages(currentMessages => [...currentMessages, { message, username }])
  }

  const handleJoinRoom = () => {
    const roomCode = roomInputRef.current.value;
    const username = usernameInputRef.current.value || socket.id;

    socket.emit('join', { roomCode, username });
  }

  const handleSendMessage = () => {
    const message = chatboxInputRef.current.value;

    socket.emit('send-message', { room, message, username });
  }

  useEffect(() => {
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('join-room', handleSocketJoinRoom);
    socket.on('update-active-users', handleSocketUpdateActiveUsers);
    socket.on('receive-message', handleSocketReceiveMessage);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('join-room');
      socket.off('update-active-users');
      socket.off('receive-message');
    };
  }, []);

  const isInRoom    = room && username;
  const isNotInRoom = !isInRoom;

  return (
    <div>
      <div>{isConnected ? 'Connected to server.' : 'Not connected to server.'}</div>

      {isNotInRoom && (
        <Fragment>
          <div>Please join a room:</div>
          <input type="text" placeholder="Enter username" ref={usernameInputRef} />
          <input type="text" placeholder="Enter roomId" ref={roomInputRef} />
          <button onClick={handleJoinRoom}>Join Room</button>
        </Fragment>
      )}

      {isInRoom && (
        <Fragment>
          <div>{`In room: ${room} as ${username}`}</div>

          <GameCanvas
            room={room}
            username={username}
          />

          <input type="text" placeholder="Enter message" ref={chatboxInputRef} />
          <button onClick={handleSendMessage}>Send Message</button>

          {messages.map(({ message, username }) => (
            <div>{`${username}: ${message}`}</div>
          ))}

        </Fragment>
      )}

    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
