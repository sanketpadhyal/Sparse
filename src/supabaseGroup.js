import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_GROUP_URL || "YOUR_SUPABASE_GROUP_URL";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_GROUP_ANON_KEY || "YOUR_SUPABASE_GROUP_ANON_KEY";

export const supabaseGroup = createClient(supabaseUrl, supabaseAnonKey);