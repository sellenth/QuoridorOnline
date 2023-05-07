'server-only'

import { Orbitron } from '@next/font/google'
export const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap'
})

export default async function Head() {
    return <>
        <title>Quoridor Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </>
}