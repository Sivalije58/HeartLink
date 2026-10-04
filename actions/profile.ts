"use server";

import { sql } from "../lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function saveProfileAction(formData: FormData) {
  try {
    const cookieStore = await cookies();

    let pendingToken =
      cookieStore.get("pendingToken")?.value;

    if (!pendingToken) {
      pendingToken =
        (formData.get("pendingToken") as string) || undefined;
    }

    if (!pendingToken) {
      return {
        success: false,
        error:
          "Registration not found. The pendingToken is missing.",
      };
    }

    const pendingResult = await sql`
      SELECT *
      FROM pending_registrations
      WHERE token = ${pendingToken}::uuid
      LIMIT 1
    `;

    if (pendingResult.length === 0) {
      return {
        success: false,
        error:
          "Temporary registration does not exist or has expired.",
      };
    }

    const pending = pendingResult[0];

    if (pending.scan_status !== "VERIFIKOVAN ✅") {
      return {
        success: false,
        error:
          "The ID card has not been verified yet.",
      };
    }

    // =========================
    // PROFILE DATA
    // =========================

    const bio =
      (formData.get("bio") as string) || "";

    const hobbies = JSON.parse(
      (formData.get("hobbies") as string) || "[]"
    );

    const values = JSON.parse(
      (formData.get("values") as string) || "[]"
    );

    const faults = JSON.parse(
      (formData.get("faults") as string) || "[]"
    );

    const icebreakers = JSON.parse(
      (formData.get("icebreakers") as string) || "[]"
    );

    const isSmoker =
      formData.get("isSmoker") === "true";

    // =========================
    // PROFILE PICTURE
    // =========================

    const image = formData.get("profileImage") as File | null;

    let photoUrl: string | null = pending.photo_url || null;

    console.log("DEBUG IMAGE:", {
      exists: !!image,
      name: image?.name,
      size: image?.size,
      type: image?.type,
    });

    if (image && image.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(image.type)) {
        return {
          success: false,
          error:
            "Only JPG, PNG, and WEBP images are allowed.",
        };
      }

      if (image.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error:
            "Image must not be larger than 5MB.",
        };
      }

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads"
      );

      await fs.mkdir(uploadsDir, {
        recursive: true,
      });

      const extension =
        image.type === "image/jpeg"
          ? ".jpg"
          : image.type === "image/png"
          ? ".png"
          : ".webp";

      const fileName =
        `${crypto.randomUUID()}${extension}`;

      const filePath = path.join(
        uploadsDir,
        fileName
      );

      const buffer = Buffer.from(
        await image.arrayBuffer()
      );

      await fs.writeFile(
        filePath,
        buffer
      );

      photoUrl =
        `/uploads/${fileName}`;

      console.log(
        "DEBUG: Profile picture saved:",
        photoUrl
      );
    }

    // =========================
    // CHECK IF USER ALREADY EXISTS
    // =========================

    const existingUser = await sql`
      SELECT id
      FROM users
      WHERE username = ${pending.username}
      LIMIT 1
    `;

    let newUserId: number;

    // If /api/upload already created the user,
    // use the existing user.
    if (existingUser.length > 0) {
      newUserId = existingUser[0].id;

      console.log(
        "DEBUG: User already exists, using ID:",
        newUserId
      );
    } else {
      const userResult = await sql`
        INSERT INTO users (
          first_name,
          last_name,
          username,
          password_hash,
          is_verified
        )
        VALUES (
          ${pending.first_name || pending.scan_ime || ""},
          ${pending.last_name || pending.scan_prezime || ""},
          ${pending.username},
          ${pending.password_hash},
          true
        )
        RETURNING id
      `;

      newUserId = userResult[0].id;

      console.log(
        "DEBUG: New user created:",
        newUserId
      );
    }

    // =========================
    // PROFILE
    // =========================

    await sql`
      INSERT INTO profiles (
        user_id,
        bio,
        hobbies,
        values_list,
        faults,
        icebreakers,
        is_smoker,
        photo_url
      )
      VALUES (
        ${newUserId},
        ${bio},
        ${hobbies},
        ${values},
        ${faults},
        ${icebreakers},
        ${isSmoker},
        ${photoUrl}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        bio = EXCLUDED.bio,
        hobbies = EXCLUDED.hobbies,
        values_list = EXCLUDED.values_list,
        faults = EXCLUDED.faults,
        icebreakers = EXCLUDED.icebreakers,
        is_smoker = EXCLUDED.is_smoker,
        photo_url = COALESCE(
          EXCLUDED.photo_url,
          profiles.photo_url
        )
    `;

    console.log(
      "DEBUG: Profile saved successfully:",
      newUserId
    );

    // =========================
    // CLEAN UP PENDING REGISTRATION
    // =========================

    await sql`
      DELETE FROM pending_registrations
      WHERE token = ${pendingToken}::uuid
    `;

    cookieStore.delete("pendingToken");

    cookieStore.set(
      "userId",
      newUserId.toString(),
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

    revalidatePath("/FYP");

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "🔥 SAVE PROFILE ERROR:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error while saving to the database.",
    };
  }
}
