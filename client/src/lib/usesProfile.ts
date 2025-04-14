import type { SupabaseClient } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  is_subscribed?: boolean;
  created_at?: string;
}

export async function createUserProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}