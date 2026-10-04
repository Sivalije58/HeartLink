import { sql } from "@vercel/postgres";
import FYPContainer from "./FYPContainer";

// We define the shape of what we get from the base.
// fetcher.tsx
interface UserProfile {
  id: number; 
  username: string;
  bio: string;
  hobbies: string;
  is_smoker: boolean;
  values: string;
  mana: string;
  icebreaker: string;
}

export default async function Page() {
  const { rows } = await sql<UserProfile>`
    SELECT 
      u.id, -- DODAJ OVO U SELECT
      u.username, 
      p.bio, 
      array_to_string(p.hobbies, ', ') as hobbies, 
      p.is_smoker, 
      array_to_string(p.values_list, ', ') as values, 
      array_to_string(p.faults, ', ') as mana, 
      array_to_string(p.icebreakers, ', ') as icebreaker
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.id != 1;
  `;
  return <FYPContainer initialData={rows} />;
}