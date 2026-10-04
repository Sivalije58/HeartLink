"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

type VerifyClientProps = {
  pendingToken: string;
};

export default function VerifyClient({
  pendingToken,
}: VerifyClientProps) {
  const router = useRouter();

  const webCameraLink =
    `https://poser-brought-mowing.ngrok-free.dev/photo?pendingToken=${encodeURIComponent(
      pendingToken
    )}`;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;

      setIsMobile(isMobileDevice);
    };

    checkDevice();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121826] border border-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">

        <h1 className="text-3xl font-bold text-white text-center mb-6">
          HeartLink Verification
        </h1>

        {isMobile ? (
          <button
            onClick={() =>
              router.push(
                `/photo?pendingToken=${encodeURIComponent(pendingToken)}`
              )
            }
            className="w-full bg-[#e20074] py-4 rounded-xl text-white font-bold"
          >
            Start Camera Scanner
          </button>
        ) : (
          <div className="w-full flex flex-col items-center">

            <div className="bg-white p-3 rounded-xl mb-6">
              <QRCodeSVG
                value={webCameraLink}
                size={180}
              />
            </div>

            <p className="text-gray-400 text-sm text-center">
              Scan this code with your phone camera to open the browser-based scanner.
            </p>

          </div>
        )}

        <button
          onClick={() => router.push("/login")}
          className="mt-6 text-xs text-gray-500"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}