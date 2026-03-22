import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout         from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute     from './components/AdminRoute'

import Home              from './pages/Home'
import Login             from './pages/Login'
import Register          from './pages/Register'
import Restaurants       from './pages/Restaurants'
import RestaurantDetail  from './pages/RestaurantDetail'
import Profile           from './pages/Profile'
import VendorDashboard   from './pages/VendorDashboard'
import VendorOnboarding  from './pages/VendorOnboarding'
import AdminDashboard    from './pages/AdminDashboard'
import About             from './pages/About'
import Contact           from './pages/Contact'
import NotFound          from './pages/NotFound'
import CuisinesPage      from './pages/Cuisines'
import HowItWorks        from './pages/HowItWorks'
import Presse            from './pages/Presse'
import Carrieres         from './pages/Carrieres'
import Aide              from './pages/Aide'
import ForgotPassword   from './pages/ForgotPassword'
import Galerie          from './pages/Galerie'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages with shared Layout (Navbar + Footer) */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/restaurants" element={<Layout><Restaurants /></Layout>} />
          <Route path="/restaurants/:id" element={<Layout><RestaurantDetail /></Layout>} />
          <Route path="/cuisines" element={<Layout><CuisinesPage /></Layout>} />
          <Route path="/a-propos" element={<Layout><About /></Layout>} />
          <Route path="/contact"          element={<Layout><Contact /></Layout>} />
          <Route path="/comment-ca-marche" element={<Layout><HowItWorks /></Layout>} />
          <Route path="/presse"            element={<Layout><Presse /></Layout>} />
          <Route path="/carrieres"         element={<Layout><Carrieres /></Layout>} />
          <Route path="/aide"              element={<Layout><Aide /></Layout>} />
          <Route path="/galerie"          element={<Layout><Galerie /></Layout>} />

          {/* Auth pages (no footer, own full-screen layout) */}
          <Route path="/connexion"              element={<Login />} />
          <Route path="/inscription"            element={<Register />} />
          <Route path="/mot-de-passe-oublie"    element={<ForgotPassword />} />

          {/* Protected: any logged-in user */}
          <Route path="/profil" element={
            <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
          } />

          {/* Protected: vendor onboarding (any user — sets up vendor profile) */}
          <Route path="/devenir-vendeur" element={
            <ProtectedRoute><VendorOnboarding /></ProtectedRoute>
          } />

          {/* Protected: vendor dashboard (pas de navbar/footer) */}
          <Route path="/tableau-de-bord" element={
            <ProtectedRoute><VendorDashboard /></ProtectedRoute>
          } />

          {/* Protected: admin dashboard (pas de navbar/footer) */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
