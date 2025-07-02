"use client";

import { useState } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket;
export default function CreateJoinRoom({ onReady }: { onReady: (roomId: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  const join = () => {
    if (!socket) socket = io();
    socket.emit('join-room', { roomId, username });
    onReady(roomId, username);
  };

  const create = () => {
    if (!socket) socket = io();
    socket.emit('create-room', username);
    socket.on('room-created', ({ roomId }) => onReady(roomId, username));
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <input className="border p-2 rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <div className="flex space-x-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={create}>Create Room</button>
        <input className="border p-2 rounded" placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={join}>Join Room</button>
      </div>
    </div>
  );
}