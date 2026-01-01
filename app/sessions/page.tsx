import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: sessions } = await supabase.from('sessions').select()

  return <pre>{JSON.stringify(sessions, null, 2)}</pre>
}