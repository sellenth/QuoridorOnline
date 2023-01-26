import { useSession, signIn, signOut } from "next-auth/react"
import LoginBtn from './login-btn'

export default function Header() {
    const { data } = useSession()
    const accessToken = data

    return (
    <div className="bg-theme-100 flex items-center">
        <h3 className="text-theme-300 flex-none  text-3xl font-bold mx-3 my-1">QO</h3>
            <div className="text-black flex-initial mr-2 ml-auto">{
            accessToken ?
                `Hello, ${accessToken.user!.name}`
                :
                `Not signed in`
            }
            </div>
        <div className="flex-initial mr-2">
            <LoginBtn />
        </div>
    </div>
    )
}