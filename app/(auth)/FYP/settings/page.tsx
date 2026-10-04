"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount, getMyUserId } from "@/app/actions";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    alert("Logging out...");
    router.push("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    const userId = await getMyUserId();

    if (!userId) {
      alert("Error: User ID was not found in the session.");
      return;
    }

    const confirmed = confirm(
      "Are you absolutely sure? This action is IRREVERSIBLE and will delete all your data!"
    );

    if (confirmed) {
      try {
        const result = await deleteMyAccount(userId);

        if (result.success) {
          // Ensure that both the client-side and server-side cookies are removed
          document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          alert("Your account has been permanently deleted.");

          // Redirect to the login page
          router.push("/login");
          router.refresh();
        } else {
          alert("An error occurred while deleting the account.");
        }
      } catch (err) {
        alert("A system error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">

          {/* Logout section */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-lg font-semibold">Account Session</h2>
              <p className="text-slate-400 text-sm">Sign out from this device</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>

          {/* Delete Account section */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
              <p className="text-slate-400 text-sm">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 rounded-lg transition"
            >
              Delete Account
            </button>
          </div>

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