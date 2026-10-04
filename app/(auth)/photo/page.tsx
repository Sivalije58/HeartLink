"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PhotoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pendingToken = searchParams.get("pendingToken");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 4096 },
            height: { ideal: 2160 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (
          videoRef.current.srcObject as MediaStream
        ).getTracks();

        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");

      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;

      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.translate(0, canvas.height);
        ctx.rotate((-90 * Math.PI) / 180);

        ctx.drawImage(
          video,
          0,
          0,
          video.videoWidth,
          video.videoHeight
        );

        const imageSrc = canvas.toDataURL("image/jpeg", 1.0);
        setImgSrc(imageSrc);
      }
    }
  };

  const uploadPhoto = async () => {
    if (!imgSrc) return;

    setIsProcessing(true);

    try {
      // Convert the photo from base64 to Blob
      const response = await fetch(imgSrc);
      const blob = await response.blob();

      const formData = new FormData();

      formData.append("photo", blob, "slika.jpg");

      const mockExif = {
        ISOSpeedRatings: 400,
        BrightnessValue: 5,
      };

      formData.append("exif", JSON.stringify(mockExif));
      formData.append(
        "vreme_sistema",
        new Date().toLocaleString()
      );

      // 🔥 IMPORTANT:
      // Send the pendingToken to the server together with the photo.
      if (pendingToken) {
        formData.append("pendingToken", pendingToken);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      const data = await res.json();

      console.log("Server result:", data);

      if (data.status === "error") {
        throw new Error(data.message || "Server error");
      }

      if (data.presuda?.includes("VERIFIKOVAN")) {
        router.push("/access_granted");
      } else {
        router.push("/access_denied");
      }
    } catch (error) {
      console.error("Error:", error);

      alert(
        "Error while sending: " +
          (error instanceof Error ? error.message : error)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121826] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        {!imgSrc ? (
          <>
            {isMounted && (
              <video
                autoPlay
                playsInline
                muted
                ref={videoRef}
                className="rounded-lg w-full h-[60vh] object-cover mb-4"
              />
            )}

            <button
              onClick={capture}
              className="w-full bg-[#e20074] py-3 rounded-xl text-white font-bold"
            >
              Take a photo.
            </button>
          </>
        ) : (
          <>
            <img
              src={imgSrc}
              alt="Image"
              className="rounded-lg w-full mb-4"
            />

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setImgSrc(null)}
                className="flex-1 bg-gray-600 py-3 rounded-xl text-white"
              >
                Again
              </button>

              <button
                onClick={uploadPhoto}
                className="flex-1 bg-green-500 py-3 rounded-xl text-white font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? "Sent" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}