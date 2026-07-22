import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface Props { children: ReactNode; noFooter?: boolean }

export default function Layout({ children, noFooter = false }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!noFooter && <Footer />}
    </div>
  )
}
