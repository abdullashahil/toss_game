"use client";

import { useEffect, useState } from 'react';
import PlayerCard from './PlayerCard';
import { Socket } from 'socket.io-client';

export default function SelectionBoard({ socket, roomId }: { socket: Socket; roomId: string }) {
  const [available, setAvailable] = useState<{ id: number; name: string }[]>([]);
  const [turn, setTurn] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    socket.on('selection-started', ({ turnOrder }) => setTurn(turnOrder[0].username));
    socket.on('turn-update', ({ currentUserId, timeLeft }) => setTimeLeft(timeLeft));
    socket.on('player-selected', ({ player }) => setAvailable(prev => prev.filter(p => p.id !== player.id)));
    socket.emit('get-players', roomId); // backend needs to support
    socket.on('player-list', (list) => setAvailable(list));
  }, [socket]);

  const select = (id: number) => socket.emit('select-player', { roomId, playerId: id });

  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="col-span-full">
        <p>Current turn: {turn}</p>
        <p>Time left: {timeLeft}s</p>
      </div>
      {available.map(p => (
        <PlayerCard key={p.id} name={p.name} onSelect={() => select(p.id)} />
      ))}
    </div>
  );
}