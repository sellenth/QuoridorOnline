import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'
import AccessToken from './access-token'

export default function Component() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
        <AccessToken />
      </>
    )
  }
  return (
      <>
          Not signed in <br />
          <Link href="/auth/signin">
          <button>Sign in</button>
          </Link>
      </>
  )
}