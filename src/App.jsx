import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './context/ToastContext'
import { MessageProvider } from './context/MessageContext'
import Layout         from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute     from './components/AdminRoute'
import ErrorBoundary  from './components/ErrorBoundary'
import CartDrawer       from './components/CartDrawer'
import CartSwitchDialog from './components/CartSwitchDialog'

// Eager-loaded pages (critical path)
import Home              from './pages/Home'
import Login             from './pages/Login'
import Register          from './pages/Register'
import Restaurants       from './pages/Restaurants'
import RestaurantDetail  from './pages/RestaurantDetail'

// Lazy-loaded pages (non-critical)
const Profile           = lazy(() => import('./pages/Profile'))
const VendorDashboard   = lazy(() => import('./pages/VendorDashboard'))
const VendorOnboarding  = lazy(() => import('./pages/VendorOnboarding'))
const AdminDashboard    = lazy(() => import('./pages/AdminDashboard'))
const Checkout          = lazy(() => import('./pages/Checkout'))
const OrderTracking     = lazy(() => import('./pages/OrderTracking'))
const Messages          = lazy(() => import('./pages/Messages'))
const About             = lazy(() => import('./pages/About'))
const Contact           = lazy(() => import('./pages/Contact'))
const CuisinesPage      = lazy(() => import('./pages/Cuisines'))
const HowItWorks        = lazy(() => import('./pages/HowItWorks'))
const Presse            = lazy(() => import('./pages/Presse'))
const Carrieres         = lazy(() => import('./pages/Carrieres'))
const Aide              = lazy(() => import('./pages/Aide'))
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'))
const Galerie           = lazy(() => import('./pages/Galerie'))
const NotFound          = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
    </div>
  )
}

function SuspenseLayout({ children }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
          <MessageProvider>
          <ToastProvider>
            <ErrorBoundary>
              {/* Cart drawer + switch confirmation (always available) */}
              <CartDrawer />
              <CartSwitchDialog />

              <Routes>
                {/* Public pages with shared Layout (Navbar + Footer) */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/restaurants" element={<Layout><Restaurants /></Layout>} />
                <Route path="/restaurants/:id" element={<Layout><RestaurantDetail /></Layout>} />
                <Route path="/cuisines" element={<SuspenseLayout><CuisinesPage /></SuspenseLayout>} />
                <Route path="/a-propos" element={<SuspenseLayout><About /></SuspenseLayout>} />
                <Route path="/contact" element={<SuspenseLayout><Contact /></SuspenseLayout>} />
                <Route path="/comment-ca-marche" element={<SuspenseLayout><HowItWorks /></SuspenseLayout>} />
                <Route path="/presse" element={<SuspenseLayout><Presse /></SuspenseLayout>} />
                <Route path="/carrieres" element={<SuspenseLayout><Carrieres /></SuspenseLayout>} />
                <Route path="/aide" element={<SuspenseLayout><Aide /></SuspenseLayout>} />
                <Route path="/galerie" element={<SuspenseLayout><Galerie /></SuspenseLayout>} />

                {/* Auth pages (no footer, own full-screen layout) */}
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
                <Route path="/mot-de-passe-oublie" element={
                  <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>
                } />

                {/* Protected: any logged-in user */}
                <Route path="/profil" element={
                  <ProtectedRoute>
                    <SuspenseLayout><Profile /></SuspenseLayout>
                  </ProtectedRoute>
                } />

                {/* Protected: checkout */}
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <SuspenseLayout><Checkout /></SuspenseLayout>
                  </ProtectedRoute>
                } />

                {/* Protected: order tracking */}
                <Route path="/mes-commandes" element={
                  <ProtectedRoute>
                    <SuspenseLayout><OrderTracking /></SuspenseLayout>
                  </ProtectedRoute>
                } />

                {/* Protected: messages */}
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <SuspenseLayout><Messages /></SuspenseLayout>
                  </ProtectedRoute>
                } />

                {/* Protected: vendor onboarding (any user — sets up vendor profile) */}
                <Route path="/devenir-vendeur" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}><VendorOnboarding /></Suspense>
                  </ProtectedRoute>
                } />

                {/* Protected: vendor dashboard (pas de navbar/footer) */}
                <Route path="/tableau-de-bord" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>
                  </ProtectedRoute>
                } />

                {/* Protected: admin dashboard (pas de navbar/footer) */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
                  </AdminRoute>
                } />

                {/* 404 */}
                <Route path="*" element={
                  <Suspense fallback={<PageLoader />}><NotFound /></Suspense>
                } />
              </Routes>
            </ErrorBoundary>
          </ToastProvider>
          </MessageProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
