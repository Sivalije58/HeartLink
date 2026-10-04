import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function ChatListPage() {
  const cookieStore = await cookies();
  const myId = parseInt(cookieStore.get("userId")?.value || "0");

  // SQL that finds the username of the OTHER person (the one you matched with)
  const matches = await sql`
    SELECT l.id, u.username 
    FROM likes l 
    JOIN users u ON (u.id = CASE WHEN l.sender_id = ${myId} THEN l.receiver_id ELSE l.sender_id END)
    WHERE (l.sender_id = ${myId} OR l.receiver_id = ${myId})
    AND l.match_status = 'accepted'
  `;

  return (
    <div className="p-10 text-white min-h-screen bg-slate-950">
      <Link 
        href="/FYP" 
        className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <span className="mr-2">←</span> FYP
      </Link>

      <h1 className="text-2xl font-bold mb-6">My Conversations</h1>

      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/FYP/chatroom/${match.id}`}
          className="..."
        >
          Conversation with: {match.username}
        </Link>
      ))}
    </div>
  );
}