import { useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function useMessageListener(myUid, setToast) {

  const seenMessages = useRef({});
  const userCache = useRef({});
  const channelRef = useRef(null);

  useEffect(() => {

    if (!myUid) return;

    channelRef.current = supabase.
    channel("global-messages").
    on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages"
      },
      async (payload) => {

        if (window.isChatRoomOpen) return;

        const msg = payload.new;

        if (msg.sender === myUid) return;

        const parts = msg.chat_id.split("_");

        if (!parts.includes(myUid)) return;

        if (seenMessages.current[msg.id]) return;
        seenMessages.current[msg.id] = true;

        const otherUid = parts.find((u) => u !== myUid);

        let userData = userCache.current[otherUid];

        if (!userData) {

          const snap = await getDoc(doc(db, "users", otherUid));

          if (!snap.exists()) return;

          userData = snap.data();

          userCache.current[otherUid] = userData;

        }

        const firstName = (userData.name || userData.username).split(" ")[0];

        setToast({
          username: userData.username,
          name: firstName,
          photo: userData.profilePhoto || "/assets/profile.png",
          role: userData.role || ""
        });

      }
    ).
    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };

  }, [myUid, setToast]);

}