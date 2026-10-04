"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/app/actions";
import Link from "next/link";

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  match_id: number;
  created_at: Date | string;
}

interface ChatProps {
  messages: Message[];
  matchId: number;
  myId: number;
}

export default function ChatPage({ messages: initialMessages, matchId, myId }: ChatProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // WebSocket synchronization (messages, edit, delete) with room check
  // WebSocket synchronization (messages, edit, delete)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onmessage = (event) => {
        console.log("WS:", event.data);



      const incoming = JSON.parse(event.data);

      if (incoming.type === "message") {
        const msg = incoming.data;
        if (Number(msg.match_id) !== Number(matchId)) return;
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });
      } 
      else if (incoming.type === "edit") {
        const msg = incoming.data;
        if (Number(msg.match_id) !== Number(matchId)) return;
        setMessages(prev =>
          prev.map(m => (m.id === msg.id ? { ...m, content: msg.content } : m))
        );
      } 
      else if (incoming.type === "delete") {
        // Also check match_id when deleting to prevent deletion in the wrong chat
        if (incoming.match_id && Number(incoming.match_id) !== Number(matchId)) return;
        
        const deletedId = Number(incoming.id);
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      }
    };
 
    return () => {
      console.log("Closing WebSocket...");
      ws.close();
    };
  }, [matchId]);

  // Expiration after 30 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length === 0) return;
      const lastMsg = messages[messages.length - 1];
      const lastMsgTime = new Date(lastMsg.created_at).getTime();
      const now = new Date().getTime();
      const thirtySeconds = 30 * 1000;

      if (now - lastMsgTime > thirtySeconds) {
        setIsExpired(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [messages]);

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await fetch(`http://localhost:5000/api/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      // Local update
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content: editContent } : m)));
      setEditingMessageId(null);
      setSelectedMessageId(null);
    } catch (error) {
      console.error("❌ Update error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/messages/${id}`, { method: "DELETE" });
      // Local deletion
      setMessages(prev => prev.filter(m => m.id !== id));
      setSelectedMessageId(null);
    } catch (error) {
      console.error("❌ Deletion error:", error);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-slate-950 text-white"
      onClick={() => { setSelectedMessageId(null); setEditingMessageId(null); }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <Link 
          href="/FYP/chatroom" 
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← ChatRoom
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const id = msg.id;
          const isSelected = selectedMessageId === id;
          const isEditing = editingMessageId === id;
          const isMe = msg.sender_id === myId;
          const uniqueKey = id ? id.toString() : `temp-${msg.sender_id}-${msg.content}`;

          return (
            <div key={uniqueKey} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (isMe) {
                    setSelectedMessageId(isSelected ? null : id); 
                    setEditContent(msg.content); 
                  }
                }}
                className={`px-4 py-2 rounded-2xl max-w-[85%] relative cursor-pointer transition-all ${
                  isMe ? 'bg-blue-600' : 'bg-slate-700'
                } ${isSelected ? "ring-2 ring-blue-400 shadow-lg" : ""}`}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <input 
                      autoFocus 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)} 
                      className="w-full bg-slate-800 text-white p-2 rounded border border-blue-500 outline-none" 
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => handleUpdate(id)} 
                        className="bg-green-600 px-2 py-1 rounded text-xs font-bold uppercase"
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingMessageId(null)} 
                        className="bg-slate-600 px-2 py-1 rounded text-xs font-bold uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{msg.content}</span>
                    {isSelected && isMe && (
                      <div className="absolute -bottom-10 right-0 flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 z-10 shadow-xl">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setEditingMessageId(id); setEditContent(msg.content); }} 
                          className="hover:bg-slate-800 p-2 rounded text-yellow-400 transition-colors"
                        >
                          ✏️
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(id); }} 
                          className="hover:bg-slate-800 p-2 rounded text-red-500 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isExpired && (
        <div className="text-center text-red-500 font-bold p-2">
          Expired. No one responded.
        </div>
      )}

      {/* Message form */}
      <form 
        ref={formRef}
        action={async (formData) => {
          const content = formData.get("content") as string;
          if (!content.trim()) return;
          formRef.current?.reset();
          await sendMessage(formData);
        }}
        className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2"
      >
        <input type="hidden" name="matchId" value={matchId} />
        <input name="content" className="flex-1 bg-slate-800 p-3 rounded-full outline-none text-white" placeholder="Write a message..." required />
        <button className="bg-blue-600 px-6 py-2 rounded-full font-bold">Send</button>
      </form>
    </div>
  );
}