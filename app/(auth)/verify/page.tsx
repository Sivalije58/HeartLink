import { cookies } from "next/headers";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage() {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get("pendingToken")?.value;

  if (!pendingToken) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-4 text-white">
        <div className="bg-[#121826] border border-gray-800 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-3">
            Verification session expired
          </h1>

          <p className="text-gray-400">
           A pendingToken is missing for this registration.
          </p>
        </div>
      </div>
    );
  }

  return <VerifyClient pendingToken={pendingToken} />;
}