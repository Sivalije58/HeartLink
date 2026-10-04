"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { loginAction } from '@/actions';

const inputStyles = "w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition text-sm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white py-10">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HeartIcon />
            <h1 className="text-3xl font-bold text-pink-500 tracking-tight">HeartLink</h1>
          </div>
          <p className="text-slate-400 font-light italic text-sm">Welcome back. Connect with intent.</p>
        </div>

        <form 
          action={async (formData: FormData) => {
            const result = await loginAction(formData);
            if (result?.error) {
              alert(result.error);
            } else {
              router.push("/FYP");
              // We will add window.location.href = "/dashboard" here later
            }
          }}  
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium ml-1 text-slate-300">Username</label>
            <input 
              name="username" 
              type="text" 
              className={inputStyles} 
              placeholder="Your username" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
            </div>
            <input 
              name="password" 
              type="password" 
              className={inputStyles} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-pink-900/20"
          >
            Login
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/register" className="text-pink-500 hover:underline font-medium">
            Join HeartLink here.
          </Link>
        </p>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pink-500 animate-pulse">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3c1.74 0 3.124.79 3.954 1.832.83-1.042 2.214-1.832 3.954-1.832 2.974 0 5.438 2.322 5.438 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}