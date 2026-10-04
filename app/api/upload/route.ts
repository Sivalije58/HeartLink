import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const incomingFormData = await request.formData();
    const flaskFormData = new FormData();

    const photo = incomingFormData.get("photo") as Blob;
    const exif = incomingFormData.get("exif") as string;
    const systemTime =
      incomingFormData.get("vreme_sistema") as string;

    const pendingToken =
      incomingFormData.get("pendingToken") as string | null;

    if (photo) {
      flaskFormData.append("photo", photo, "slika.jpg");
    }

    if (exif) {
      flaskFormData.append("exif", exif);
    }

    if (systemTime) {
      flaskFormData.append("vreme_sistema", systemTime);
    }

    const flaskResponse = await fetch(
      "http://127.0.0.1:5001/upload",
      {
        method: "POST",
        body: flaskFormData,
      }
    );

    const flaskData = await flaskResponse.json();

    console.log("=================================");
    console.log("FLASK STATUS:", flaskResponse.status);
    console.log("FLASK DATA:", flaskData);
    console.log("PENDING TOKEN:", pendingToken);
    console.log("=================================");

    // ==========================================
    // SAVE VERIFICATION RESULT TO DATABASE
    // ==========================================

    if (pendingToken && flaskData.presuda) {
      console.log(
        "DEBUG: Saving verification result:",
        pendingToken,
        flaskData.presuda
      );

      // 1. Update the pending registration with the scanner result
      await sql`
        UPDATE pending_registrations
        SET
          scan_status = ${flaskData.presuda},
          scan_ime = ${flaskData.ime || null},
          scan_prezime = ${flaskData.prezime || null},
          scan_datum_rodjenja = ${flaskData.datum_rodjenja || null}
        WHERE token = ${pendingToken}::uuid
      `;

      console.log(
        "DEBUG: pending_registrations updated!"
      );

      // 2. If the ID card passed verification,
      //    move the user from pending_registrations to users
      if (flaskData.presuda === "verified") {
        console.log(
          "DEBUG: Verification successful, moving user to users..."
        );

        const pendingResult = await sql`
          SELECT
            username,
            password_hash,
            first_name,
            last_name
          FROM pending_registrations
          WHERE token = ${pendingToken}::uuid
            AND scan_status = 'verified'
        `;

        if (pendingResult.length === 0) {
          throw new Error(
            "Temporary registration does not exist or has not been verified."
          );
        }

        const pending = pendingResult[0];

        // 3. Create the actual user
        const userResult = await sql`
          INSERT INTO users (
            first_name,
            last_name,
            username,
            password_hash,
            is_verified
          )
          VALUES (
            ${pending.first_name},
            ${pending.last_name},
            ${pending.username},
            ${pending.password_hash},
            true
          )
          RETURNING id
        `;

        console.log(
          "DEBUG: User successfully inserted into users, ID:",
          userResult[0].id
        );

        // 4. Once moved to users, delete the temporary registration
        await sql`
          DELETE FROM pending_registrations
          WHERE token = ${pendingToken}::uuid
        `;

        console.log(
          "DEBUG: pending_registrations deleted after successful registration."
        );
      }
    }

    const response = NextResponse.json(flaskData, {
      status: flaskResponse.status,
    });

    if (pendingToken) {
      response.cookies.set("pendingToken", pendingToken, {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL === "1",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
    }

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error("[!] Error in route:", message);

    return NextResponse.json(
      {
        status: "error",
        message: "Error: " + message,
      },
      { status: 500 }
    );
  }
}