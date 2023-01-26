import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'
import AccessToken from './access-token'

export default function Component() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
      <>
          <Link href="/auth/signin">
            <button>Sign in</button>
          </Link>
      </>
  )
}