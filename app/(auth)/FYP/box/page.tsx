import {
  getReceivedLikes,
  getReceivedDislikes,
  getSentLikes,
  respondToLike,
} from "@/app/actions";

import Link from "next/link";

interface LikeItem {
  id: number;
  username: string;
  bio: string;
  status: "like" | "dislike";
  match_status: "accepted" | "declined" | null;
}

export default async function BoxPage() {
  const receivedLikes = (await getReceivedLikes()) as LikeItem[];
  const receivedDislikes = (await getReceivedDislikes()) as LikeItem[];
  const sentLikes = (await getSentLikes()) as LikeItem[];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold text-pink-500 mb-8">
          Activity Box
        </h1>

        <Link
          href="/FYP"
          className="text-slate-400 hover:text-white mb-8 block"
        >
          ← Back to FYP
        </Link>

        {/* ========================= */}
        {/* INBOX */}
        {/* ========================= */}

        <h2 className="text-xl font-semibold mb-4 text-slate-300">
          Inbox (Requests for you)
        </h2>

        {receivedLikes.length === 0 ? (
          <p className="text-slate-500 mb-8">
            No new requests.
          </p>
        ) : (
          <div className="space-y-4 mb-10">

            {receivedLikes.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 p-6 rounded-xl border border-slate-800"
              >
                <h2 className="text-xl font-bold">
                  {item.username}
                </h2>

                <p className="text-slate-300 mt-2">
                  {item.bio}
                </p>

                {item.match_status === null ? (

                  <div className="flex gap-4 mt-4">

                    <form
                      action={async () => {
                        "use server";
                        await respondToLike(item.id, "accepted");
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-pink-600 px-6 py-2 rounded-full hover:bg-pink-700 transition"
                      >
                        ❤️ Accept
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await respondToLike(item.id, "declined");
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-slate-700 px-6 py-2 rounded-full hover:bg-slate-600 transition"
                      >
                        ❌ Decline
                      </button>
                    </form>

                  </div>

                ) : item.match_status === "accepted" ? (

                  <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-green-400 font-bold">
                      🎉 Congratulations! Go for a drink! 🥂
                    </p>
                  </div>

                ) : (

                  <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-red-400 font-bold">
                      ❌ Declined.
                    </p>
                  </div>

                )}
              </div>
            ))}

          </div>
        )}
        
        {/* ========================= */}
        {/* REJECTIONS */}
        {/* ========================= */}

        <h2 className="text-xl font-semibold mb-4 text-slate-300">
          Rejections
        </h2>

        {receivedDislikes.length === 0 ? (

          <p className="text-slate-500 mb-10">
            No one has rejected you yet.
          </p>

        ) : (

          <div className="space-y-4 mb-10">

            {receivedDislikes.map((item) => (

              <div
                key={item.id}
                className="bg-slate-900 p-6 rounded-xl border border-slate-800"
              >

                <h2 className="text-xl font-bold">
                  {item.username}
                </h2>

                <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">

                  <p className="text-red-400 font-bold">
                    ❌ {item.username} rejected you.
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* ========================= */}
        {/* SENT */}
        {/* ========================= */}

        <h2 className="text-xl font-semibold mb-4 text-slate-300">
          Sent (Your likes - Responses)
        </h2>

        {sentLikes.length === 0 ? (

          <p className="text-slate-500">
            No responses yet.
          </p>

        ) : (

          <div className="space-y-4">

            {sentLikes.map((item) => (

              <div
                key={item.id}
                className="bg-slate-900 p-6 rounded-xl border border-slate-800"
              >

                <h2 className="text-xl font-bold">
                  Profile: {item.username}
                </h2>

                <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">

                  {item.status === "dislike" ? (

                    <p className="text-slate-400 font-bold">
                      ❌ You rejected {item.username}.
                    </p>

                  ) : item.match_status === null ? (

                    <p className="text-yellow-400 font-bold">
                      ⏳ Waiting for a response...
                    </p>

                  ) : item.match_status === "accepted" ? (

                    <p className="text-green-400 font-bold">
                      🎉 Congratulations! Go for a drink! 🥂
                    </p>

                  ) : (

                    <p className="text-red-400 font-bold">
                      ❌ {item.username} rejected you. Keep your head up! 💪
                    </p>

                  )}

                </div>
              </div>

            ))}

          </div>
        )}

      </div>
    </div>
  );
}