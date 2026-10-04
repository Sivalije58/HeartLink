import "dotenv/config";

import express from "express";
import http from "http";
import pg from "pg";
const { Pool } = pg;
import cors from "cors";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

// ✅ WebSocket Setup
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);
// ───────────── API ROUTES (AUTH & USERS) ─────────────

app.post("/api/login", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username not found." });
  try {
    await pool.query(
      "INSERT INTO users (username) VALUES ($1) ON CONFLICT (username) DO NOTHING", 
      [username]
    );
    res.json({ success: true, username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login error in DB." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username FROM users ORDER BY username ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ───────────── API ROUTES (CHAT CORE) ─────────────

// 1. Global chat with LIMIT.
app.get("/api/messages", async (req, res) => {
  const limit = 20;
  const offset = req.query.offset || 0;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE room_id IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Global messages error:", err); 
    res.status(500).json({ error: err.message });
  }
});

// 2. Private chat with LIMIT
app.get("/api/messages/:room_id", async (req, res) => {
  const { room_id } = req.params; 
  const limit = 20;
  const offset = req.query.offset || 0;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", 
      [room_id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Private messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Sending messages.
app.post("/api/messages", async (req, res) => {
  const { username, content, room_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO messages (username, content, room_id) VALUES ($1, $2, $3) RETURNING *",
      [username, content, room_id || null]
    );
    
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "message", data: result.rows[0] }));
      }
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROUTE FOR NEXT.JS SERVER ACTION ---
app.post("/send", (req, res) => {
    const msgData = req.body;
    console.log("📥 Received from Next.js (HeartLink):", msgData);
    
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { 
            client.send(JSON.stringify({ type: "message", data: msgData }));
        }
    });
    
    res.status(200).json({ success: true });
});

// 4. UPDATE message
app.put("/api/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query("UPDATE messages SET content = $1 WHERE id = $2 RETURNING *", [content, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    const updatedMsg = result.rows[0];
    
    // Broadcast the full message object so the client knows the exact match_id and id
    wss.clients.forEach(client => { 
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "edit", data: updatedMsg })); 
      }
    });
    res.json(updatedMsg);
  } catch (err) { 
    console.error("PUT error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// 5. DELETE message
app.delete("/api/messages/:id", async (req, res) => {
  const { id } = req.params;

  console.log("DELETE request:", id);

  const found = await pool.query(
    "SELECT * FROM messages WHERE id = $1",
    [id]
  );

  const messageToDelete = found.rows[0];

  console.log("Found message:", messageToDelete);

  try {
    // First retrieve the message so we know which match_id it belongs to before deleting it
    const found = await pool.query("SELECT * FROM messages WHERE id = $1", [id]);
    const messageToDelete = found.rows[0];

    await pool.query("DELETE FROM messages WHERE id = $1", [id]);
    
    console.log("Broadcasting delete:", {
      id,
      match_id: messageToDelete?.match_id,
      clients: wss.clients.size
    });

    wss.clients.forEach(client => { 
      if (client.readyState === 1) {
        client.send(JSON.stringify({ 
          type: "delete", 
          id: Number(id), 
          match_id: messageToDelete ? messageToDelete.match_id : null 
        })); 
      }
    });
    res.json({ message: "Deleted" });
  } catch (err) { 
    console.error("DELETE FULL ERROR:");
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




async function autoDeclineOldLikes() {
  try {
    const result = await pool.query(`
      UPDATE likes
      SET match_status = 'declined'
      WHERE status = 'like'
        AND match_status IS NULL
        AND created_at < NOW() - INTERVAL '15 seconds'
      RETURNING id, sender_id, receiver_id
    `);

    if (result.rows.length > 0) {
      console.log(
        "⏰ Auto-decline:",
        result.rows.length,
        "request(s) automatically declined."
      );
    }
  } catch (err) {
    console.error("❌ Auto-decline error:", err);
  }
}

// Check every 10 seconds
setInterval(autoDeclineOldLikes, 10_000);

// Run immediately when the server starts
autoDeclineOldLikes();

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server works on port ${PORT}`);
});