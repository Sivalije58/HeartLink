"use client";

import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white">
      <div className="bg-slate-900 p-8 rounded-3xl border border-red-500/30 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] w-full max-w-sm">
        <div className="text-6xl mb-4">❌</div>

        <h1 className="text-2xl font-bold mb-2 text-red-400">
          Access denied.
        </h1>

        <p className="text-slate-400 mb-6">
          Document is not valid or checkup did not succeed. Please take a picture
          from your document again with better lighting.
        </p>
        
        <div className="flex flex-col gap-3">
          {/* MAIN BUTTON */}
          <button 
            onClick={() => router.push('/photo')}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold transition"
          >
            Try again.
          </button>
          
          {/* BUTTON TO RETURN TO LOGIN */}
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-medium text-slate-400 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}