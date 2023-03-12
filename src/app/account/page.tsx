'use client'
import { useSupabase } from "@/components/supabase-provider"
import { useRouter } from 'next/navigation';

export default function AccountPage (){
  const { supabase, session } = useSupabase()
  const router = useRouter()

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()

      if (error) {
          console.log({ error })
      }

    router.push('/signin')
  }

  let username = session?.user.user_metadata.preferred_username ?? null

return <div className="text-gray-200">
        <div className="max-w-sm align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <h1 className="underline font-display">{username}</h1>
            <p>Nothing here yet</p>
            <button onClick={handleLogout} className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
          >Logout</button>
        </div>
    </div>
}