import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// SecureStore adapter stores tokens encrypted on device
// This is more secure than regular storage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// createClient connects your app to your Supabase database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use encrypted storage instead of plain storage
    storage: ExpoSecureStoreAdapter,
    // Automatically refresh login tokens
    autoRefreshToken: true,
    // Keep user logged in between app opens
    persistSession: true,
    // Don't use browser-based login (we're in a mobile app)
    detectSessionInUrl: false,
  },
});
