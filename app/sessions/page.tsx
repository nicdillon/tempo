import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

export default async function Page() {
    return <div className='flex justify-center flex-col gap-5 border-2 p-5 rounded'>
        <h1 className="text-2xl font-bold">Tempo Sessions</h1>
        <Suspense fallback={<div>Loading sessions...</div>}>
            {getSessions()}
        </Suspense>
    </div>
}

async function getSessions() {
    const supabase = await createClient()
    const { data: sessions } = await supabase.from('sessions').select()

    return (
        <div>
            <h2>Total Sessions: {sessions?.length}</h2>
            <ul>
                {sessions?.map(session => {
                    return <li key={session.id}>
                        Project: {session.project} <br/>
                        Duration: {session.duration}
                    </li>
                })}
            </ul>
        </div>)
}