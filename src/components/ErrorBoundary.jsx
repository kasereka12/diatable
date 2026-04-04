import { Component } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-400" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-dark mb-3">
              Oups, une erreur est survenue
            </h1>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              Quelque chose s'est mal passé. Veuillez réessayer ou retourner à l'accueil.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="btn btn-gold text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} /> Réessayer
              </button>
              <Link to="/" className="btn btn-dark text-sm flex items-center gap-2">
                <Home size={16} /> Accueil
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
