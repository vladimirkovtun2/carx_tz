import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Клиент держим в globalThis, чтобы при hot-reload в dev не плодить соединения
const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

export function getSupabase(): SupabaseClient {
    if (!globalForSupabase.supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY;
        if (!url || !key) {
            throw new Error("Задайте SUPABASE_URL и SUPABASE_ANON_KEY в .env.local");
        }
        globalForSupabase.supabase = createClient(url, key);
    }
    return globalForSupabase.supabase;
}
