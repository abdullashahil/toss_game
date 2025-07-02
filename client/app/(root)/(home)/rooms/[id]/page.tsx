"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import Lobby from '@/components/Lobby';
import SelectionBoard from '@/components/SelectionBoard';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [step, setStep] = useState<'lobby' | 'selection'>('lobby');
  const [username, setUsername] = useState('');
  const socketRef = useRef<Socket | null>(null); // store socket in ref

  // Establish socket connection
  useEffect(() => {
    if (!roomId) return;

    
    const socket = io(); // adjust URL if needed
    socketRef.current = socket;

    socket.emit('join-room-ui', roomId);

    socket.on('room-joined', ({ username: user }) => setUsername(user));
    socket.on('room-created', ({ username: user }) => setUsername(user));
    socket.on('start-selection', () => setStep('selection'));

    return () => {
      socket.disconnect(); // cleanup on unmount
    };
  }, [roomId]);

  const handleStart = () => {
    socketRef.current?.emit('start-selection', roomId);
    setStep('selection');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      {step === 'lobby' && socketRef.current && (
        <Lobby
          socket={socketRef.current}
          roomId={roomId}
          username={username}
          onStart={handleStart}
        />
      )}
      {step === 'selection' && socketRef.current && (
        <SelectionBoard
          socket={socketRef.current}
          roomId={roomId}
        />
      )}
    </main>
  );
}
