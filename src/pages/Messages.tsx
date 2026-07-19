import { useAuth } from '../context/AuthContext'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import MessagingPanel from '../components/MessagingPanel'

export default function Messages() {
  const { profile } = useAuth()
  const isVendor = profile?.role === 'vendor'

  return (
    <div className="bg-cream min-h-screen pt-24">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to={isVendor ? '/tableau-de-bord' : '/profil'} className="text-muted text-sm hover:text-dark transition-colors flex items-center gap-1 mb-3">
            <ArrowLeft size={16} /> Retour
          </Link>
          <h1 className="font-serif text-3xl font-bold text-dark flex items-center gap-3">
            <MessageCircle size={28} className="text-gold" />
            Messages
          </h1>
        </div>

        <MessagingPanel />
      </div>
    </div>
  )
}
