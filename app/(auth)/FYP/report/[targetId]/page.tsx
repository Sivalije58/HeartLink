"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { reportUser } from "@/app/actions"; // We will add this action to actions.ts

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const targetId = params.targetId as string; // ID of the user being reported

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleReport = async (reason: string) => {
    setSelectedReason(reason);
    const confirmed = confirm(
      `Are you sure you want to report this user?`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await reportUser(targetId, reason);

      if (result.success) {
        alert(
          "Profile reported successfully. Thank you for helping keep the community safe."
        );
        router.push("/FYP");
        router.refresh();
      } else {
        alert("An error occurred while submitting the report.");
      }
    } catch (err) {
      alert("A system error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Report Profile</h1>
        <p className="text-slate-400 mb-8">
          Why do you want to report this profile?
        </p>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          
          {/* Option 1: Fake profile */}
          <button
            onClick={() =>
              handleReport("This person is using fake profile.")
            }
            disabled={loading}
            className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between group"
          >
            <div>
              <h2 className="text-lg font-semibold text-white group-hover:text-pink-500 transition">
                Fake Profile
              </h2>
              <p className="text-slate-400 text-sm">
                This person is using a fake profile or pretending to be someone else.
              </p>
            </div>
            <span className="text-slate-500 group-hover:text-white transition">
              →
            </span>
          </button>

          {/* Option 2: Violating community guidelines */}
          <button
            onClick={() =>
              handleReport(
                "This person is violating community guidelines. (Very aggressive, unpleasant and etc...)"
              )
            }
            disabled={loading}
            className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between group"
          >
            <div>
              <h2 className="text-lg font-semibold text-red-400 group-hover:text-red-500 transition">
                Violating Community Guidelines
              </h2>
              <p className="text-slate-400 text-sm">
                Very aggressive, unpleasant, inappropriate behavior or communication.
              </p>
            </div>
            <span className="text-slate-500 group-hover:text-white transition">
              →
            </span>
          </button>

        </div>
        
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="mt-6 text-slate-400 hover:text-white transition"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}