"use client";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();
  
  // Put here your current NGROK link:
  const ngrokLink = "https://poser-brought-mowing.ngrok-free.dev"; 
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ngrokLink)}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4 font-sans">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        
        <h1 className="text-3xl font-extrabold text-pink-500 mb-3 text-center">
          HeartLink Verification
        </h1>
        
        <p className="text-gray-300 text-center mb-6 text-sm leading-relaxed">
          We are creating a safe place. Prove that behind the profile is a real person and not a minor.
        </p>

        {/* --- QR KOD SECTION FOR COMPUTER --- */}
        <div className="hidden md:flex flex-col items-center bg-white p-4 rounded-xl mb-6 shadow-inner">
          <p className="text-xs text-gray-750 font-semibold mb-2 text-gray-800">
            📱 Scan with your phone camera:
          </p>
          <img src={qrApiUrl} alt="HeartLink QR Code" className="w-[180px] h-[180px]" />
        </div>
        {/* ---------------------------------- */}

        <div className="bg-gray-950 p-4 rounded-xl mb-6 border border-gray-800">
          <h2 className="font-semibold text-base mb-3 text-gray-200">
            💡 How to verify?
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-450 text-gray-400">
            <li>Scan the QR code above using your phone, or use the button below if you are already on mobile.</li>
            <li>Ensure the environment is well-lit so the text is not blurry.</li>
            <li>Our OCR system will cross-check your registration details with your ID.</li>
          </ol>
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          🔒 <span className="font-medium text-gray-400">Privacy:</span> ID images are not stored in our database.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/photo")}
            className="w-full bg-pink-600 hover:bg-pink-500 text-white py-3 rounded-xl font-bold transition text-center shadow-md"
          >
            Go to Scanner
          </button>
          
          <button
            onClick={() => alert("Back to login...")}
            className="w-full bg-transparent hover:bg-gray-800 text-gray-400 text-sm py-2 rounded-xl font-medium transition text-center"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}