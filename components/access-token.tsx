import { useSession, signIn, signOut } from "next-auth/react"

export default function Component() {
    const { data } = useSession()
    const accessToken = data
    if (accessToken) {
        return <div>Access Token: {accessToken.user.name}</div>
    } else {
        return <div>Access Token: ???</div>
    }
}