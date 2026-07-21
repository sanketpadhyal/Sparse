import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const sendPushNotification = async ({ receiver_uid, sender_name, message }) => {
  const pushUrl = process.env.REACT_APP_PUSH_FUNCTION_URL || (supabaseUrl && supabaseUrl !== "YOUR_SUPABASE_URL" ? `${supabaseUrl}/functions/v1/send-push` : "");
  if (!pushUrl) return;
  try {
    await fetch(pushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        receiver_uid,
        sender_name,
        message
      })
    });
  } catch (err) {}
};