"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import {sql} from "../lib/db";
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs'; // Assuming you are using bcrypt for passwords
import { revalidatePath } from 'next/cache';



interface ProfileData {
  bio: string;
  hobbies: string[];
  values: string[];
  faults: string[];
  isSmoker: boolean;
  icebreakers: string[];
}

export async function createProfile(formData: FormData) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;

  if (!userIdStr) {
    return { success: false, error: "You are not logged in!" };
  }

  // Use activeUserId instead of userId to avoid any duplication
  const activeUserId = parseInt(userIdStr);

  const bio = formData.get("bio") as string;
  const hobbies = JSON.parse((formData.get("hobbies") as string) || "[]");
  const values = JSON.parse((formData.get("values") as string) || "[]");
  const faults = JSON.parse((formData.get("faults") as string) || "[]");
  const isSmoker = formData.get("isSmoker") === "true";
  const icebreakers = JSON.parse((formData.get("icebreakers") as string) || "[]");
   


  const image = formData.get("profileImage") as File | null;

let photoUrl: string | null = null;

if (image && image.size > 0) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(image.type)) {
    return {
      success: false,
      error: "Only JPG, PNG, and WEBP images are allowed.",
    };
  }

  if (image.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "Image must not be larger than 5MB.",
    };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadsDir, { recursive: true });

  const extension =
    image.type === "image/jpeg"
      ? ".jpg"
      : image.type === "image/png"
      ? ".png"
      : ".webp";

  const fileName = `${crypto.randomUUID()}${extension}`;

  const filePath = path.join(uploadsDir, fileName);

  const buffer = Buffer.from(await image.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  photoUrl = `/uploads/${fileName}`;
  }





  try {
    await sql`
  INSERT INTO profiles (
    user_id,
    bio,
    hobbies,
    values_list,
    faults,
    is_smoker,
    icebreakers,
    photo_url
  )
  VALUES (
    ${activeUserId},
    ${bio},
    ${hobbies},
    ${values},
    ${faults},
    ${isSmoker},
    ${icebreakers},
    ${photoUrl}
  )
`;
    return { success: true };
  } catch (error) {
    console.error("Error writing to database:", error);
    return { success: false, error: "Could not write to the database." };
  }
}

export async function swipeUser(
  targetUserId: string,
  status: 'like' | 'dislike'
) {
  const cookieStore = await cookies();

  const myId = parseInt(cookieStore.get("userId")?.value || "0");
  const targetId = parseInt(targetUserId);

  console.log("DEBUG SWIPE:", {
    myId,
    targetId,
    status
  });

  if (!myId || !targetId) {
    return {
      success: false,
      error: "Invalid user."
    };
  }

  try {
    await sql`
  INSERT INTO likes (
    sender_id,
    receiver_id,
    status
  )
  VALUES (
    ${myId},
    ${targetId},
    ${status}
  )
  ON CONFLICT (sender_id, receiver_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    match_status = NULL,
    created_at = NOW()
`;

    console.log(
      `DEBUG SWIPE: ${status} successfully saved: ${myId} -> ${targetId}`
    );

    revalidatePath("/FYP");
    revalidatePath("/FYP/box");

    return {
      success: true,
      status
    };

  } catch (err) {
    console.error("DEBUG SWIPE ERROR:", err);

    return {
      success: false,
      error: "Error saving like/dislike."
    };
  }
}





export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const result = await sql`SELECT id, password_hash FROM users WHERE username = ${username}`;
  const user = result[0];

  if (!user) return { success: false, error: "User does not exist." };

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return { success: false, error: "Incorrect password." };

  // --- PASTE THIS PART OF THE CODE HERE ---
  const cookieStore = await cookies();
  
  // 1. RESET: Completely remove the old cookie
  cookieStore.delete("userId"); 

  // 2. ASSIGN: Immediately save the new ID for the new user
  // actions.ts (inside the loginAction function)
   cookieStore.set("userId", user.id.toString(), { 
     httpOnly: true, 
     secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1", // Adjusted for ngrok HTTPS
     sameSite: 'lax',
     path: '/',
     maxAge: 60 * 60 * 24 // 1 day
   });

  return { success: true };
  // --------------------------------
}

export async function getReceivedLikes() {
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;

  if (!myIdStr) return [];

  const myId = parseInt(myIdStr);

  const result = await sql`
    SELECT
      l.id,
      u.username,
      p.bio,
      l.status,
      l.match_status
    FROM likes l
    JOIN users u
      ON l.sender_id = u.id
    LEFT JOIN profiles p
      ON u.id = p.user_id
    WHERE l.receiver_id = ${myId}
      AND l.status = 'like'
    ORDER BY l.created_at DESC
  `;

  return result;
}



// Update the status instead of deleting
export async function respondToLike(
  likeId: number,
  decision: "accepted" | "declined"
) {
  try {
    const result = await sql`
      UPDATE likes
      SET match_status = ${decision}
      WHERE id = ${likeId}
        AND status = 'like'
        AND match_status IS NULL
      RETURNING id
    `;

    if (result.length === 0) {
      console.log(
        "RESPOND LIKE: The request has already been processed or does not exist:",
        likeId
      );

      return {
        success: false,
        error: "This request has already been processed or has expired."
      };
    }

    revalidatePath("/FYP/box");

    return {
      success: true
    };

  } catch (error) {
    console.error("RESPOND LIKE ERROR:", error);

    return {
      success: false,
      error: "Error processing the request."
    };
  }
}

// Function that counts ONLY new likes (where status is NULL)
export async function getNewLikesCount() {
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;

  if (!myIdStr) return 0;

  const result = await sql`
    SELECT COUNT(*) as count 
    FROM likes 
    WHERE receiver_id = ${parseInt(myIdStr)}
      AND status = 'like'
      AND match_status IS NULL
  `;

  return parseInt(result[0].count as string);
}



export async function getNewDislikesCount() {
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;

  if (!myIdStr) return 0;

  const myId = parseInt(myIdStr);

  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM likes
    WHERE receiver_id = ${myId}
      AND status = 'dislike'
  `;

  return result[0]?.count ?? 0;
}




export async function getNewResponsesCount() {
  const cookieStore = await cookies();
  const myId = cookieStore.get("userId")?.value;
  if (!myId) return 0;

  // Look for likes that were sent by this user (sender_id),

  // but for now we will only count those that have been changed)
  const result = await sql`
    SELECT COUNT(*) as count 
    FROM likes 
    WHERE sender_id = ${parseInt(myId)} 
    AND match_status IS NOT NULL
  `;
  return parseInt(result[0].count as string);
}

export async function getSentLikes() {
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;

  if (!myIdStr) return [];

  const myId = parseInt(myIdStr);

  const result = await sql`
    SELECT
      l.id,
      u.username,
      p.bio,
      l.status,
      l.match_status
    FROM likes l
    JOIN users u
      ON l.receiver_id = u.id
    LEFT JOIN profiles p
      ON u.id = p.user_id
    WHERE l.sender_id = ${myId}
    ORDER BY l.created_at DESC
  `;

  return result;
}

export async function getReceivedDislikes() {
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;

  if (!myIdStr) return [];

  const myId = parseInt(myIdStr);

  const result = await sql`
    SELECT
      l.id,
      u.username,
      p.bio,
      l.status,
      l.match_status
    FROM likes l
    JOIN users u
      ON l.sender_id = u.id
    LEFT JOIN profiles p
      ON u.id = p.user_id
    WHERE l.receiver_id = ${myId}
      AND l.status = 'dislike'
    ORDER BY l.created_at DESC
  `;

  return result;
}

// The following was written below.
/* export async function autoDeclineOldLikes() {
  try {
    await sql`
      UPDATE likes
      SET match_status = 'declined'
      WHERE status = 'like'
        AND match_status IS NULL
        AND created_at < NOW() - INTERVAL '5 minutes'
    `;
  } catch (error) {
    console.error("Error during auto-decline:", error);
  }
}
*/ 
// Temporarily remove this until the situation is resolved.

// Added. You can delete this later if needed.
export async function getMessages(matchId: number) {
  // Safety check to prevent sending invalid data to the database
  if (!matchId || isNaN(matchId)) {
    console.error("❌ Error: Invalid matchId:", matchId);
    return [];
  }

  // Fetch messages
  const messages = await sql`
    SELECT * FROM messages 
    WHERE match_id = ${matchId} 
    ORDER BY created_at ASC
  `;
  
  // Timer logic: Check whether 2 hours have passed since the last message
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const lastTime = new Date(lastMessage.created_at).getTime();
    const now = new Date().getTime();
    const timeLimit = 30*1000;

    if (now - lastTime > timeLimit) {
      // If the time has passed, mark the match as expired
      await sql`UPDATE likes SET status = 'expired' WHERE id = ${matchId}`;
      console.log("⏰ Time expired for match:", matchId);
    }
  }
  
  return messages;
}

// This function is called when the user clicks "Send"

export async function sendMessage(formData: FormData) {
  const content = formData.get("content") as string;
  const matchId = parseInt(formData.get("matchId") as string);
  
  const cookieStore = await cookies();
  const myIdStr = cookieStore.get("userId")?.value;
  const myId = parseInt(myIdStr || "0");

  if (!content || isNaN(matchId) || myId === 0) {
    console.error("❌ Error: Valid data is missing!");
    return { success: false, error: "Invalid data" };
  }

  try {
    // 1. Insert into database
    const insertedMessage = await sql`
      INSERT INTO messages (match_id, sender_id, content, created_at)
      VALUES (${matchId}, ${myId}, ${content}, NOW())
      RETURNING *
    `;

    // 2. SEND TO WEBSOCKET (THIS IS THE PART)
    const msgData = insertedMessage[0];

    try {
      await fetch('http://127.0.0.1:5000/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
    } catch (e) {
      console.log("⚠️ WebSocket server is unavailable, the message is in the database but the realtime notification was not delivered.");
    }

    // 3. Cache refresh
    //revalidatePath(`/FYP/chatroom/${matchId}`);
    return { success: true };

  } catch (error) {
    console.error("❌ SQL ERROR:", error);
    throw error;
  }
}

// If your 'likes' table contains the matches,
// and the column in 'messages' is 'match_id', then you need:

export async function expireMatch(matchId: number) {
  try {
    // 1. Check: Does the match exist at all?
    const match = await sql`SELECT id FROM likes WHERE id = ${matchId}`;
    
    if (match.length === 0) {
      console.warn(`⚠️ Attempted to expire a match that does not exist: ${matchId}`);
      return;
    }

    // 2. Update:
    // If the id in 'likes' is actually the matchId used in chat:
    await sql`
      UPDATE likes 
      SET status = 'expired' 
      WHERE id = ${matchId}
    `;
    
    console.log(`✅ Match ${matchId} has expired successfully.`);
  } catch (error) {
    console.error("❌ Error updating match status:", error);
  }
}

export async function searchUserByUsername(username: string) {
  try {
    const result = await sql`
      SELECT
        u.id,
        u.username,
        p.bio,
        p.photo_url,
        array_to_string(p.hobbies, ', ') AS hobbies,
        array_to_string(p.values_list, ', ') AS values,
        p.is_smoker,
        array_to_string(p.faults, ', ') AS mana,
        array_to_string(p.icebreakers, ', ') AS icebreaker
      FROM users u
      JOIN profiles p
        ON u.id = p.user_id
      WHERE u.username ILIKE ${username}
      LIMIT 1;
    `;

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
}

export async function deleteMyAccount(userId: string) {
  try {
    const id = parseInt(userId);
    
    // 1. Delete likes in which the user participated
    await sql`DELETE FROM likes WHERE sender_id = ${id} OR receiver_id = ${id}`;
    
    // 2. Delete profiles (because of the foreign key)
    await sql`DELETE FROM profiles WHERE user_id = ${id}`;

    // 3. Delete messages where the user is the sender
    await sql`DELETE FROM messages WHERE sender_id = ${id}`;
    
    // 4. Finally, delete the user itself
    await sql`DELETE FROM users WHERE id = ${id}`;
    
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false };
  }
}

export async function getMyUserId() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll(); // Get all cookies to see what exists
  console.log("All cookies on the server:", allCookies); 
  
  const userId = cookieStore.get("userId")?.value;
  console.log("Found userId:", userId);
  
  return userId || null;
}

export async function reportUser(targetUserId: string, reason: string) {
  const myCookie = (await cookies()).get("userId")?.value;
  const myId = myCookie ? parseInt(myCookie) : 0;
  const targetId = parseInt(targetUserId);

  // Add this security check!
  if (!myId || isNaN(myId) || !targetId || isNaN(targetId)) {
    console.error("❌ Error: Invalid IDs while reporting", { myId, targetId });
    return { success: false, error: "Invalid user IDs" };
  }

  try {
    await sql`
      INSERT INTO reports (reporter_id, reported_id, reason) 
      VALUES (${myId}, ${targetId}, ${reason})
    `;

    await sql`
      DELETE FROM likes 
      WHERE (sender_id = ${myId} AND receiver_id = ${targetId}) 
         OR (sender_id = ${targetId} AND receiver_id = ${myId})
    `;

    return { success: true };
  } catch (err) {
    console.error("Report error:", err);
    return { success: false };
  }
}


export async function getAdjacentUser(
  currentId: number,
  direction: "next" | "prev"
) {
  try {
    let result;

    if (direction === "next") {
      // Find the first user whose ID is greater than the current one
      result = await sql`
        SELECT
          u.id,
          u.username,
          p.bio,
          p.photo_url,
          array_to_string(p.hobbies, ', ') AS hobbies,
          array_to_string(p.values_list, ', ') AS values,
          p.is_smoker,
          array_to_string(p.faults, ', ') AS mana,
          array_to_string(p.icebreakers, ', ') AS icebreaker
        FROM users u
        JOIN profiles p
          ON u.id = p.user_id
        WHERE u.id > ${currentId}
        ORDER BY u.id ASC
        LIMIT 1;
      `;

      // If there are no more users ahead, return to the first user
      if (result.length === 0) {
        result = await sql`
          SELECT
            u.id,
            u.username,
            p.bio,
            p.photo_url,
            array_to_string(p.hobbies, ', ') AS hobbies,
            array_to_string(p.values_list, ', ') AS values,
            p.is_smoker,
            array_to_string(p.faults, ', ') AS mana,
            array_to_string(p.icebreakers, ', ') AS icebreaker
          FROM users u
          JOIN profiles p
            ON u.id = p.user_id
          ORDER BY u.id ASC
          LIMIT 1;
        `;
      }
    } else {
      // Find the last user whose ID is lower than the current one
      result = await sql`
        SELECT
          u.id,
          u.username,
          p.bio,
          p.photo_url,
          array_to_string(p.hobbies, ', ') AS hobbies,
          array_to_string(p.values_list, ', ') AS values,
          p.is_smoker,
          array_to_string(p.faults, ', ') AS mana,
          array_to_string(p.icebreakers, ', ') AS icebreaker
        FROM users u
        JOIN profiles p
          ON u.id = p.user_id
        WHERE u.id < ${currentId}
        ORDER BY u.id DESC
        LIMIT 1;
      `;

      // If there are no more users behind, go to the last user
      if (result.length === 0) {
        result = await sql`
          SELECT
            u.id,
            u.username,
            p.bio,
            p.photo_url,
            array_to_string(p.hobbies, ', ') AS hobbies,
            array_to_string(p.values_list, ', ') AS values,
            p.is_smoker,
            array_to_string(p.faults, ', ') AS mana,
            array_to_string(p.icebreakers, ', ') AS icebreaker
          FROM users u
          JOIN profiles p
            ON u.id = p.user_id
          ORDER BY u.id DESC
          LIMIT 1;
        `;
      }
    }

    return result.length > 0 ? result[0] : null;

  } catch (error) {
    console.error(
      "Error fetching adjacent user:",
      error
    );

    return null;
  }
}