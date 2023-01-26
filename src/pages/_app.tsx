import { SessionProvider } from "next-auth/react"
import type { AppProps } from 'next/app'
import './globals.css';
import Head from 'next/head'
import Header from '../../components/header'

export default function App({ Component,
                              pageProps: { session, ...pageProps }}: AppProps
) {
  return (
      <SessionProvider session={session}>
          <Head>
            <title>Quoridor Online</title>
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <meta name="description" content="Official Website of Quoridor Online" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Header />
          <Component {...pageProps} />
      </SessionProvider>
  )
}