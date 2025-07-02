"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { socket } from '@/lib/socket';
import Lobby from '@/components/Lobby';
import SelectionBoard from '@/components/SelectionBoard';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const initialUser = searchParams.get('user') || '';

  const [step, setStep] = useState<'lobby' | 'selection'>('lobby');
  const [username, setUsername] = useState(initialUser);

  useEffect(() => {
    if (!roomId || !username) return;

    // Join the room once with username
    socket.emit('join-room', { roomId, username });
    // If this client created the room, backend will send room-created instead

    // Listen for server events
    socket.on('room-joined', ({ username: user }) => setUsername(user));
    socket.on('room-created', ({ username: user }) => setUsername(user));
    socket.on('selection-started', () => setStep('selection'));

    return () => {
      socket.off('room-joined');
      socket.off('room-created');
      socket.off('selection-started');
    };
}, [roomId, username]);

  const handleStart = () => {
    socket.emit('start-selection', roomId);
    setStep('selection');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      {step === 'lobby' && (
        <Lobby
          socket={socket}
          roomId={roomId}
          username={username}
          onStart={handleStart}
        />
      )}
      {step === 'selection' && (
        <SelectionBoard
          socket={socket}
          roomId={roomId}
        />
      )}
    </main>
  );
}