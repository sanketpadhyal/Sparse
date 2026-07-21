import webpush from "npm:web-push";

const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "YOUR_VAPID_PUBLIC_KEY";
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "YOUR_VAPID_PRIVATE_KEY";

webpush.setVapidDetails(
  "mailto:contact@example.com",
  publicKey,
  privateKey
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { receiver_uid, sender_name, message } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const res = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?uid=eq.${receiver_uid}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`
        }
      }
    );

    const subs = await res.json();

    for (const row of subs) {
      const payload = JSON.stringify({
        title: sender_name,
        body: message,
        url: "/dashboard/chat",
        icon: "/logo192.png"
      });

      await webpush.sendNotification(row.subscription, payload);
    }

    return new Response("sent", { headers: corsHeaders });
  } catch (err) {
    return new Response(err.message, { status: 500, headers: corsHeaders });
  }
});