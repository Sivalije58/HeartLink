import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import ChatPage from './ChatPage';

// 1. Define the interface here
interface Message {
  id: number;
  content: string;
  sender_id: number;
  match_id: number;    // Added
  created_at: Date;    // Added (or string, depending on how Postgres returns it)
}

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const id = parseInt(matchId);
  
  const cookieStore = await cookies();
  const myId = parseInt(cookieStore.get("userId")?.value || "0");

  // 2. Add the <Message[]> type directly to the SQL query
  const messages = await sql<Message[]>`
    SELECT id, content, sender_id 
    FROM messages 
    WHERE match_id = ${id} 
    ORDER BY created_at ASC
  `;

  // 3. Now we pass the correct type, without "as any"
  return (
    <ChatPage 
      messages={messages} 
      matchId={id} 
      myId={myId} 
    />
  );
}