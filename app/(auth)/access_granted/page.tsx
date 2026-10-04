"use client";
import { useRouter } from 'next/navigation'; 
 
export default function AccessGranted() { 
  const router = useRouter(); 
 
  return ( 
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white"> 
      <div className="bg-slate-900 p-8 rounded-3xl border border-green-500/30 shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] w-full max-w-sm"> 
        {/* Green light/icon */} 
        <div className="text-6xl mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">✅</div> 
         
        {/* Text with green glow */} 
        <h1 className="text-2xl font-bold mb-2 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"> 
          Access granted, you may enter HeartLink. :D 
        </h1> 
         
        <button  
          onClick={() => router.push('/create_profile')} 
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold transition shadow-[0_0_15px_rgba(22,163,74,0.4)]" 
        > 
          Create a profile. 
        </button> 
      </div> 
    </div> 
  ); 
}