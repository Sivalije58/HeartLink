"use client";

import { useEffect, useState } from 'react';
import {
  getNewLikesCount,
  getNewResponsesCount,
  getNewDislikesCount
} from '@/app/actions';

export default function NotificationWatcher() {
  const [lastLikes, setLastLikes] = useState(0);
  const [lastResponses, setLastResponses] = useState(0);
  const [lastDislikes, setLastDislikes] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {

      // 1. Someone liked me
      const newLikes = await getNewLikesCount();

      if (newLikes > lastLikes) {
        alert("Hey! Someone liked you! ❤️");
      }

      setLastLikes(newLikes);


      // 2. Someone responded to my like
      const newResponses = await getNewResponsesCount();

      if (newResponses > lastResponses) {
        alert("Hey! Someone responded to your like! Check your Box. 💌");
      }

      setLastResponses(newResponses);


      // 3. Someone rejected me
      const newDislikes = await getNewDislikesCount();

      if (newDislikes > lastDislikes) {
        alert("Someone rejected you, keep your head up! 💪");
      }

      setLastDislikes(newDislikes);

    }, 5000);

    return () => clearInterval(interval);
  }, [lastLikes, lastResponses, lastDislikes]);

  return null;
}