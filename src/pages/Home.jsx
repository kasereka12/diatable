import Hero            from '../components/Hero'
import CuisineFilter   from '../components/CuisineFilter'
import HowItWorks      from '../components/HowItWorks'
import FeaturedCuisines from '../components/FeaturedCuisines'
import WhyDiaTable     from '../components/WhyDiaTable'
import Testimonials    from '../components/Testimonials'
import VendorCTA       from '../components/VendorCTA'

export default function Home() {
  return (
    <>
      <Hero />
      <CuisineFilter />
      <HowItWorks />
      <FeaturedCuisines />
      <WhyDiaTable />
      <Testimonials />
      <VendorCTA />
    </>
  )
}
