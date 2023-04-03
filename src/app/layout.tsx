import SupabaseListener from '../components/supabase-listener'
import SupabaseProvider from '../components/supabase-provider'
import Header from '../components/header'
import { createServerClient } from '../utils/supabase-server'

import { Orbitron } from '@next/font/google'
export const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap'
})

import './globals.css'


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
    <html lang="en" className={`${orbitron.variable}`}>
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
