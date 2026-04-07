import Hero from '../components/Hero'
import CuisineFilter from '../components/CuisineFilter'
import HowItWorks from '../components/HowItWorks'
import FeaturedCuisines from '../components/FeaturedCuisines'
import WhyDiaTable from '../components/WhyDiaTable'
import Testimonials from '../components/Testimonials'
import VendorCTA from '../components/VendorCTA'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)


  async function fetchProfile(userId) {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setProfile(data)
  }
  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
    }
  }, [user])


  return (
    <>
      <Hero />
      <CuisineFilter />
      <HowItWorks />
      <FeaturedCuisines />
      <WhyDiaTable />
      <Testimonials />
      {profile?.role === 'client' && <VendorCTA />}
    </>
  )
}
