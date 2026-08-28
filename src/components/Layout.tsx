import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'

interface Props { children: ReactNode; noFooter?: boolean }

export default function Layout({ children, noFooter = false }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
      <ChatWidget />
    </div>
  )
}
