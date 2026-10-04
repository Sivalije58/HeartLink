"use server";

import sql from "@/lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function registerAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const image = formData.get("profileImage") as File | null;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match!" };
  }

  if (!username || !password) {
    return {
      error: "Username and password are required.",
    };
  }

  try {
    // Check username
    const existingUser = await sql`
      SELECT id
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    const existingPending = await sql`
      SELECT token
      FROM pending_registrations
      WHERE username = ${username}
      LIMIT 1
    `;

    if (existingUser.length > 0 || existingPending.length > 0) {
      return {
        error: "Username is already taken.",
      };
    }

    // =========================
    // PROFILE PICTURE
    // =========================

    let photoUrl: string | null = null;

    if (image && image.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(image.type)) {
        return {
          error: "Only JPG, PNG, and WEBP images are allowed.",
        };
      }

      if (image.size > 5 * 1024 * 1024) {
        return {
          error: "Image must not be larger than 5MB.",
        };
      }

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads"
      );

      await fs.mkdir(uploadsDir, { recursive: true });

      const extension =
        image.type === "image/jpeg"
          ? ".jpg"
          : image.type === "image/png"
          ? ".png"
          : ".webp";

      const fileName = `${crypto.randomUUID()}${extension}`;

      const filePath = path.join(
        uploadsDir,
        fileName
      );

      const buffer = Buffer.from(
        await image.arrayBuffer()
      );

      await fs.writeFile(filePath, buffer);

      photoUrl = `/uploads/${fileName}`;

      console.log(
        "DEBUG: Profile picture saved:",
        photoUrl
      );
    }

    // =========================
    // PASSWORD HASHING
    // =========================

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(
      password,
      saltRounds
    );

    // =========================
    // PENDING REGISTRATION
    // =========================

    const result = await sql`
      INSERT INTO pending_registrations (
        username,
        password_hash,
        first_name,
        last_name,
        scan_status,
        photo_url
      )
      VALUES (
        ${username},
        ${passwordHash},
        ${firstName},
        ${lastName},
        'pending',
        ${photoUrl}
      )
      RETURNING token
    `;

    const pendingToken = result[0].token;

    console.log(
      "DEBUG: Pending registration created:",
      pendingToken.toString()
    );

    // =========================
    // COOKIE
    // =========================

    const cookieStore = await cookies();

    cookieStore.set(
      "pendingToken",
      pendingToken.toString(),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL === "1",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return {
      success: true,
      pendingToken: pendingToken.toString(),
    };

  } catch (err) {
    console.error(
      "Registration error:",
      err
    );

    return {
      error:
        "An error occurred during registration.",
    };
  }
}

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return {
      error: "Username and password are required.",
    };
  }

  try {
    const result = await sql`
      SELECT id, password_hash, is_verified
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (result.length === 0) {
      return {
        error: "User does not exist!",
      };
    }

    const user = result[0];

    // IMPORTANT: use bcrypt.compare because new passwords are hashed
    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return {
        error: "Incorrect password!",
      };
    }

    const cookieStore = await cookies();

    cookieStore.set("userId", user.id.toString(), {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL === "1",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return {
      success: true,
    };
  } catch (err) {
    console.error("Login error:", err);

    return {
      error: "A server error occurred.",
    };
  }
}

export async function getReceivedLikes() {
  const myId = (await cookies()).get("userId")?.value;

  if (!myId) {
    return [];
  }

  const result = await sql`
    SELECT
      users.username,
      profiles.bio
    FROM likes
    JOIN users
      ON likes.sender_id = users.id
    LEFT JOIN profiles
      ON users.id = profiles.user_id
    WHERE
      likes.receiver_id = ${myId}
      AND likes.status = 'like'
  `;

  return result;
}

export async function getMyUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  return userId || null;
}