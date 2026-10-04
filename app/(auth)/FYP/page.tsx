import { cookies } from "next/headers";
import { Pool } from "pg";
import FYPContainer from "./FYPContainer";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

export default async function Page() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return <p>Please Login!</p>;
  }

  const userIdNumber = parseInt(userId);

  const { rows } = await pool.query<UserProfile>(
    `
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
      WHERE u.id != $1;
    `,
    [userIdNumber]
  );

  return <FYPContainer initialData={rows} />;
}