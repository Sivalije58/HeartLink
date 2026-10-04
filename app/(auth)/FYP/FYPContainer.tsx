"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  swipeUser,
  searchUserByUsername,
  getAdjacentUser,
} from "@/app/actions";

interface UserProfile {
  id: number;
  username: string;
  bio: string;
  photo_url: string | null;
  hobbies: string;
  is_smoker: boolean;
  values: string;
  mana: string;
  icebreaker: string;
}

export default function FYPContainer({
  initialData,
}: {
  initialData: UserProfile[];
}) {
  const router = useRouter();
  
  const [usedPrev, setUsedPrev] = useState(false);
  const [usedNext, setUsedNext] = useState(false);

  const [users, setUsers] = useState<UserProfile[]>(initialData);
  const [input, setInput] = useState("");
  const [activeUser, setActiveUser] = useState<UserProfile | null>(
    users[0] || null
  );
  const [swiping, setSwiping] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;

    const foundUser = await searchUserByUsername(input);

    if (foundUser) {
      setActiveUser(foundUser as UserProfile);
    } else {
      alert("User not found!");
    }
  };

  const handleArrow = async (direction: "next" | "prev") => {
    if (!activeUser) return;

    if (direction === "prev" && usedPrev) return;
    if (direction === "next" && usedNext) return;

    const nextUser = await getAdjacentUser(
      activeUser.id,
      direction
    );

    if (!nextUser) return;

    setActiveUser(nextUser as UserProfile);

    if (direction === "prev") {
      setUsedPrev(true);
    } else {
      setUsedNext(true);
    }
  };

  const handleSwipe = async (action: "like" | "dislike") => {
    if (!activeUser?.id) {
      alert("Error: User ID is missing");
      return;
    }

    if (swiping) return;

    setSwiping(true);

    console.log("CLIENT SWIPE:", {
      targetId: activeUser.id,
      action,
    });

    try {
      const result = await swipeUser(
        activeUser.id.toString(),
        action
      );

      console.log("CLIENT SWIPE RESULT:", result);

      if (!result?.success) {
        alert(result?.error || "Error while saving.");
        return;
      }

      alert(
        action === "like"
          ? "❤️ Like saved!"
          : "❌ Dislike saved!"
      );

      const remainingUsers = users.filter(
        (u) => u.id !== activeUser.id
      );

      setUsers(remainingUsers);
      setActiveUser(remainingUsers[0] || null);
    } finally {
      setSwiping(false);
    }
  };

  if (!initialData || initialData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-xl text-slate-400">
          There are currently no users with similar interests...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex p-6 gap-6">

      {/* LEFT SIDE */}
      <div className="w-1/3 space-y-6">

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Search users..."
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:border-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center justify-center"
          >
            ➤
          </button>
        </div>

        <Link
          href="/FYP/box"
          className="block hover:opacity-80 transition"
        >
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 cursor-pointer">
            <h2 className="text-pink-500 font-bold mb-2">
              [ ? ]
            </h2>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center animate-pulse">
                ?
              </div>

              <span>
                Find out who has a crush on you.
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/FYP/chatroom"
          className="block hover:opacity-80 transition"
        >
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 cursor-pointer flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              💬
            </div>

            <div>
              <h2 className="text-blue-400 font-bold">
                My Chats
              </h2>

              <span className="text-sm text-slate-400">
                Open active conversations
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/FYP/settings"
          className="block hover:opacity-80 transition"
        >
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 cursor-pointer flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl">
              ⚙️
            </div>

            <div>
              <h2 className="text-slate-200 font-bold">
                Settings
              </h2>

              <span className="text-sm text-slate-400">
                Manage your profile
              </span>
            </div>
          </div>
        </Link>

      </div>

      {/* RIGHT SIDE */}
      <div className="w-2/3 bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col items-center relative">

        {activeUser && (
          <button
            onClick={() =>
              router.push(`/FYP/report/${activeUser.id}`)
            }
            className="absolute top-4 right-4 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-700 px-4 py-2 rounded-lg font-bold transition-all duration-200"
          >
            ⚑ Report Profile
          </button>
        )}

        {activeUser ? (
          <div className="w-full flex flex-col items-center justify-between h-full pt-8">

            <div className="w-full text-center">

              {/* PROFILE PICTURE */}
              <div className="mb-5 flex justify-center">

                {activeUser.photo_url ? (
                  <img
                    src={activeUser.photo_url}
                    alt={`Profile picture of ${activeUser.username}`}
                    className="w-80 h-80 object-cover rounded-2xl border-2 border-slate-700 shadow-lg"
                  />
                ) : (
                  <div className="w-56 h-56 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
                    No picture
                  </div>
                )}

              </div>

              {/* USERNAME */}
              <h2 className="text-2xl font-bold mb-4 text-blue-400">
                @{activeUser.username}
              </h2>

              {/* INFORMATION */}
              <div className="w-full text-left bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-3">

                <h3 className="text-xl font-semibold">
                  {activeUser.bio || "No bio available"}
                </h3>

                <p className="text-slate-400">
                  <strong className="text-slate-200">
                    Interests:
                  </strong>{" "}
                  {activeUser.hobbies || "No interests added"}
                </p>

                <p className="text-slate-400">
                  <strong className="text-slate-200">
                    Smoker or vapes:
                  </strong>{" "}
                  {activeUser.is_smoker ? "🚬 Yes" : "🚭 No"}
                </p>

                <p className="text-slate-400">
                  <strong className="text-slate-200">
                    Values:
                  </strong>{" "}
                  {activeUser.values ||
                    "No values added"}
                </p>

              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex items-center gap-6 mt-8">

              <button
                onClick={() => handleArrow("prev")}
                disabled={usedPrev}
                className={`w-14 h-14 rounded-full transition shadow-lg text-3xl flex items-center justify-center ${
                  usedPrev
                    ? "bg-slate-900 text-slate-700 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                ←
              </button>

              <button
                onClick={() => handleSwipe("dislike")}
                className="bg-slate-800 p-6 rounded-full hover:bg-slate-700 transition shadow-lg text-xl"
              >
                ❌
              </button>

              <button
                onClick={() => handleSwipe("like")}
                className="bg-pink-600 p-6 rounded-full text-3xl hover:bg-pink-700 transition shadow-lg"
              >
                ❤️
              </button>

              <button
                onClick={() => handleArrow("next")}
                disabled={usedNext}
                className={`w-14 h-14 rounded-full transition shadow-lg text-3xl flex items-center justify-center ${
                  usedNext
                    ? "bg-slate-900 text-slate-700 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                →
              </button>

            </div>

          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-center">
            <p>
              No more profiles to display. Search for someone
              specific using the search bar on the left!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}