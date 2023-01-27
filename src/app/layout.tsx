import 'server-only'

import SupabaseListener from '../components/supabase-listener'
import SupabaseProvider from '../components/supabase-provider'
import Header from '../components/header'
import './globals.css'
import { createServerClient } from '../utils/supabase-server'

// do not cache this layout
export const revalidate = 0

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body className="flex flex-col h-screen">
        <SupabaseProvider session={session}>
          <SupabaseListener serverAccessToken={session?.access_token} />
          <Header />
          <div className="flex-1">
          {children}
          </div>
        </SupabaseProvider>
      </body>
    </html>
  )
}
