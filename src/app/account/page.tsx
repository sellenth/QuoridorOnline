'use client'
import { useSupabase } from "@/components/supabase-provider"

export default function AccountPage (){
  const { supabase, session } = useSupabase()

  let username = session?.user.user_metadata.preferred_username ?? null

return <div className="text-gray-200">
        <div className="max-w-sm align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <h1 className="underline font-display">{username}</h1>
            <p>Nothing here yet</p>
        </div>
    </div>
}