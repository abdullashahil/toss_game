"use client";

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export default function Lobby({ socket, roomId, username, onStart }: { socket: Socket; roomId: string; username: string; onStart: () => void }) {
  const [users, setUsers] = useState<string[]>([username]);

  useEffect(() => {
    socket.on('user-joined', ({ username }) => setUsers(prev => [...prev, username]));
  }, [socket]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Room: {roomId}</h2>
      <ul className="list-disc ml-5">
        {users.map(u => <li key={u}>{u}</li>)}
      </ul>
      {/** Only host sees Start button, simplify: everyone */}
      <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded" onClick={onStart}>Start Selection</button>
    </div>
  );
}
