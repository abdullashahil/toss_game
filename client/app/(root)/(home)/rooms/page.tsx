"use client"

import { useRouter } from 'next/navigation';
import CreateJoinRoom from '@/components/CreateJoinRoom';

export default function RoomsEntry() {
  const router = useRouter();
  const handleReady = (roomId: string, username: string) => {
    router.push(`/rooms/${roomId}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <CreateJoinRoom onReady={handleReady} />
    </main>
  );
}