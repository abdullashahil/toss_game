"use client";

import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';

export default function CreateJoinRoom({ onReady }: { onReady: (roomId: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    // Handle room-created and room-joined events
    socket.on('room-created', ({ roomId }) => onReady(roomId, username));
    socket.on('room-joined', ({ roomId }) => onReady(roomId, username));

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
    };
  }, [username, onReady]);

  const join = () => {
    if (!username || !roomId) return;
    socket.emit('join-room', { roomId, username });
  };

  const create = () => {
    if (!username) return;
    socket.emit('create-room', username);
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <input
        className="border p-2 rounded"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <div className="flex space-x-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={create}
          disabled={!username}
        >
          Create Room
        </button>
        <input
          className="border p-2 rounded"
          placeholder="Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={join}
          disabled={!username || !roomId}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
