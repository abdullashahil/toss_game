import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-green-500 text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Shotgun Toss</h1>
      <p className="mb-8">Real-time Cricket Team Selection</p>
      <Link href="/rooms" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
          Get Started
      </Link>
    </main>
  );
}
