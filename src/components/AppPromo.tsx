import { Apple, PlayCircle, Search, MapPin, Star } from 'lucide-react'

// Store badges are custom-built (no real listing to link to yet), clearly
// labelled "Bientôt disponible" rather than pointing to a fake/dead app page.
function StoreBadge({ Icon, kicker, name }: { Icon: typeof Apple; kicker: string; name: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1f1f1f] text-white cursor-default select-none">
      <Icon size={22} />
      <div className="text-left leading-none">
        <div className="text-[0.6rem] text-white/60">{kicker}</div>
        <div className="text-sm font-semibold mt-0.5">{name}</div>
      </div>
    </div>
  )
}

export default function AppPromo() {
  return (
    <section className="py-20 overflow-hidden" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          {/* Text + badges */}
          <div data-reveal>
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: '#f4a828' }}>
              Bientôt disponible
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
              DiaTable dans votre poche
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed max-w-md">
              Commandez, suivez vos livraisons et découvrez de nouveaux vendeurs partout où vous êtes.
              L'application mobile DiaTable arrive bientôt sur iOS et Android.
            </p>
            <div className="flex flex-wrap gap-3">
              <StoreBadge Icon={Apple} kicker="Bientôt sur" name="App Store" />
              <StoreBadge Icon={PlayCircle} kicker="Bientôt sur" name="Google Play" />
            </div>
          </div>

          {/* Stylised phone mockup — abstract UI, not a real screenshot */}
          <div className="flex justify-center md:justify-end" data-reveal data-delay="0.15s">
            <div className="relative w-[220px] h-[440px] rounded-[2.25rem] p-2.5"
              style={{ backgroundColor: '#000', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden relative" style={{ backgroundColor: '#f9f4ee' }}>
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-xl z-10" style={{ backgroundColor: '#000' }} />

                {/* Mock header */}
                <div className="pt-8 pb-4 px-4" style={{ backgroundColor: '#c5611a' }}>
                  <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-2">
                    <Search size={12} className="text-white/80" />
                    <div className="h-2 w-24 rounded-full bg-white/40" />
                  </div>
                </div>

                {/* Mock cuisine chips */}
                <div className="flex gap-1.5 px-4 mt-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-6 w-12 rounded-full" style={{ backgroundColor: i === 0 ? '#c5611a' : '#e9e2d6' }} />
                  ))}
                </div>

                {/* Mock cards */}
                <div className="px-4 mt-4 space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="rounded-xl bg-white p-2.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div className="h-14 rounded-lg mb-2" style={{ background: 'linear-gradient(135deg,#f4a828,#c5611a)' }} />
                      <div className="h-2 w-20 rounded-full mb-1.5" style={{ backgroundColor: '#1f1f1f', opacity: 0.8 }} />
                      <div className="flex items-center gap-1">
                        <Star size={9} className="text-amber-400 fill-amber-400" />
                        <div className="h-1.5 w-10 rounded-full bg-black/10" />
                        <MapPin size={9} className="text-black/30 ml-1.5" />
                        <div className="h-1.5 w-14 rounded-full bg-black/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
