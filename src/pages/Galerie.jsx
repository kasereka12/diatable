import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { Search, ArrowRight, X } from 'lucide-react'

/* ─── DATA ─────────────────────────────────────────────── */
const DISHES = [
  // SÉNÉGAL
  {
    id: 1, country: 'Sénégal', flag: '🇸🇳', cuisine: 'senegalaise',
    name: 'Thiéboudienne', tag: 'Plat national',
    desc: 'Riz au poisson cuit dans une sauce tomate riche, avec légumes et épices. Le plat emblématique du Sénégal.',
    gradient: 'linear-gradient(145deg, #e8521a 0%, #f4a828 50%, #c8390e 100%)',
    accent: '#e8521a', size: 'large',
  },
  {
    id: 2, country: 'Sénégal', flag: '🇸🇳', cuisine: 'senegalaise',
    name: 'Yassa Poulet', tag: 'Incontournable',
    desc: 'Poulet mariné et caramélisé aux oignons et citron, servi sur riz blanc.',
    gradient: 'linear-gradient(145deg, #f4a828 0%, #e8ca5a 60%, #c8841a 100%)',
    accent: '#f4a828', size: 'small',
  },
  {
    id: 3, country: 'Sénégal', flag: '🇸🇳', cuisine: 'senegalaise',
    name: 'Mafé', tag: 'Sauce arachide',
    desc: 'Ragoût de viande en sauce arachide onctueuse, servi avec du riz ou du foufou.',
    gradient: 'linear-gradient(145deg, #8B4513 0%, #D2691E 60%, #A0522D 100%)',
    accent: '#8B4513', size: 'small',
  },

  // LIBAN
  {
    id: 4, country: 'Liban', flag: '🇱🇧', cuisine: 'libanaise',
    name: 'Mezze Libanais', tag: 'Festif',
    desc: 'Un festin de houmous, falafel, taboulé, fattoush et feuilles de vigne — la générosité libanaise à table.',
    gradient: 'linear-gradient(145deg, #1b5e20 0%, #43a047 50%, #2e7d32 100%)',
    accent: '#43a047', size: 'large',
  },
  {
    id: 5, country: 'Liban', flag: '🇱🇧', cuisine: 'libanaise',
    name: 'Kafta Grillée', tag: 'Grill',
    desc: 'Brochettes d\'agneau haché aux épices, persil et oignons, grillées sur braise.',
    gradient: 'linear-gradient(145deg, #bf360c 0%, #e64a19 60%, #ff7043 100%)',
    accent: '#e64a19', size: 'small',
  },
  {
    id: 6, country: 'Liban', flag: '🇱🇧', cuisine: 'libanaise',
    name: 'Baklava', tag: 'Pâtisserie',
    desc: 'Feuilleté de pâte filo aux noix et pistaches, nappé de sirop de fleur d\'oranger.',
    gradient: 'linear-gradient(145deg, #f9a825 0%, #fdd835 50%, #f57f17 100%)',
    accent: '#f9a825', size: 'small',
  },

  // CHINE
  {
    id: 7, country: 'Chine', flag: '🇨🇳', cuisine: 'chinoise',
    name: 'Dim Sum', tag: 'Traditionnel',
    desc: 'Délicates bouchées vapeur — har gow, siu mai, char siu bao — la cérémonie du yum cha.',
    gradient: 'linear-gradient(145deg, #b71c1c 0%, #e53935 50%, #ef5350 100%)',
    accent: '#e53935', size: 'large',
  },
  {
    id: 8, country: 'Chine', flag: '🇨🇳', cuisine: 'chinoise',
    name: 'Canard Laqué', tag: 'Pékin',
    desc: 'Canard rôti à la peau croustillante et laquée, servi avec crêpes, concombre et sauce hoisin.',
    gradient: 'linear-gradient(145deg, #880e4f 0%, #c2185b 60%, #e91e63 100%)',
    accent: '#c2185b', size: 'small',
  },
  {
    id: 9, country: 'Chine', flag: '🇨🇳', cuisine: 'chinoise',
    name: 'Ramen Sichuan', tag: 'Épicé',
    desc: 'Nouilles dans un bouillon épicé au piment de Sichuan, porc effiloché et œuf mollet.',
    gradient: 'linear-gradient(145deg, #e65100 0%, #ff6d00 50%, #ffab40 100%)',
    accent: '#ff6d00', size: 'small',
  },

  // SYRIE
  {
    id: 10, country: 'Syrie', flag: '🇸🇾', cuisine: 'syrienne',
    name: 'Shawarma Syrien', tag: 'Street food',
    desc: 'Viande rôtie à la broche, marinée aux épices, enroulée dans du pain pita avec ail, légumes et tahini.',
    gradient: 'linear-gradient(145deg, #4a148c 0%, #7b1fa2 50%, #9c27b0 100%)',
    accent: '#7b1fa2', size: 'large',
  },
  {
    id: 11, country: 'Syrie', flag: '🇸🇾', cuisine: 'syrienne',
    name: 'Kibbeh', tag: 'Classique',
    desc: 'Boulettes de boulgour farci à la viande d\'agneau et pignons, frites ou en soupe.',
    gradient: 'linear-gradient(145deg, #311b92 0%, #512da8 60%, #7e57c2 100%)',
    accent: '#512da8', size: 'small',
  },
  {
    id: 12, country: 'Syrie', flag: '🇸🇾', cuisine: 'syrienne',
    name: 'Fatteh', tag: 'Petit-déjeuner',
    desc: 'Pain de la veille, pois chiches, yaourt à l\'ail et sumac — un plat réconfortant du matin.',
    gradient: 'linear-gradient(145deg, #f3e5f5 0%, #ce93d8 50%, #ab47bc 100%)',
    accent: '#ab47bc', size: 'small',
  },

  // FRANCE
  {
    id: 13, country: 'France', flag: '🇫🇷', cuisine: 'francaise',
    name: 'Croissants', tag: 'Viennoiserie',
    desc: 'Feuilletés pur beurre, croustillants à l\'extérieur et moelleux à l\'intérieur.',
    gradient: 'linear-gradient(145deg, #0d47a1 0%, #1565c0 50%, #42a5f5 100%)',
    accent: '#1565c0', size: 'small',
  },
  {
    id: 14, country: 'France', flag: '🇫🇷', cuisine: 'francaise',
    name: 'Bœuf Bourguignon', tag: 'Cuisine du terroir',
    desc: 'Mijotage de bœuf dans du vin de Bourgogne avec champignons, lardons et carottes.',
    gradient: 'linear-gradient(145deg, #4e342e 0%, #795548 60%, #a1887f 100%)',
    accent: '#795548', size: 'large',
  },
  {
    id: 15, country: 'France', flag: '🇫🇷', cuisine: 'francaise',
    name: 'Crème Brûlée', tag: 'Dessert',
    desc: 'Crème vanillée sous une fine croûte de sucre caramélisé à la flamme.',
    gradient: 'linear-gradient(145deg, #f8bbd0 0%, #f48fb1 50%, #e91e63 100%)',
    accent: '#e91e63', size: 'small',
  },

  // ITALIE
  {
    id: 16, country: 'Italie', flag: '🇮🇹', cuisine: 'italienne',
    name: 'Pizza Napolitaine', tag: 'Patrimoine UNESCO',
    desc: 'Pâte à fermentation lente, tomate San Marzano, mozzarella di bufala, basilic frais.',
    gradient: 'linear-gradient(145deg, #c62828 0%, #d32f2f 50%, #1b5e20 100%)',
    accent: '#d32f2f', size: 'large',
  },
  {
    id: 17, country: 'Italie', flag: '🇮🇹', cuisine: 'italienne',
    name: 'Risotto Milanese', tag: 'Lombardie',
    desc: 'Riz Arborio au bouillon de veau et safran, fini au parmesan et au beurre froid.',
    gradient: 'linear-gradient(145deg, #f9a825 0%, #fdd835 40%, #f57f17 100%)',
    accent: '#f57f17', size: 'small',
  },
  {
    id: 18, country: 'Italie', flag: '🇮🇹', cuisine: 'italienne',
    name: 'Tiramisu', tag: 'Dessert',
    desc: 'Mascarpone et biscuits imbibés d\'espresso et de marsala, saupoudrés de cacao.',
    gradient: 'linear-gradient(145deg, #3e2723 0%, #6d4c41 50%, #a1887f 100%)',
    accent: '#6d4c41', size: 'small',
  },

  // NIGERIA
  {
    id: 19, country: 'Nigéria', flag: '🇳🇬', cuisine: 'nigeriane',
    name: 'Jollof Rice', tag: 'Incontournable',
    desc: 'Riz cuit dans une sauce tomate et épices, fumé légèrement au feu de bois — fierté nationale.',
    gradient: 'linear-gradient(145deg, #1b5e20 0%, #388e3c 50%, #f9a825 100%)',
    accent: '#388e3c', size: 'large',
  },
  {
    id: 20, country: 'Nigéria', flag: '🇳🇬', cuisine: 'nigeriane',
    name: 'Egusi Soup', tag: 'Traditionnel',
    desc: 'Soupe épaisse aux graines de melon, légumes-feuilles, poisson fumé et épices.',
    gradient: 'linear-gradient(145deg, #558b2f 0%, #7cb342 60%, #aed581 100%)',
    accent: '#7cb342', size: 'small',
  },
  {
    id: 21, country: 'Nigéria', flag: '🇳🇬', cuisine: 'nigeriane',
    name: 'Suya', tag: 'Barbecue',
    desc: 'Brochettes de bœuf marinées à la poudre de yaji et arachides, grillées sur charbon.',
    gradient: 'linear-gradient(145deg, #e65100 0%, #bf360c 50%, #ff7043 100%)',
    accent: '#bf360c', size: 'small',
  },

  // INDE
  {
    id: 22, country: 'Inde', flag: '🇮🇳', cuisine: 'indienne',
    name: 'Butter Chicken', tag: 'Curry',
    desc: 'Poulet tandoori dans une sauce tomate crémeuse au beurre, cardamome et fenugrec.',
    gradient: 'linear-gradient(145deg, #e65100 0%, #fbc02d 60%, #ff6f00 100%)',
    accent: '#ff6f00', size: 'large',
  },
  {
    id: 23, country: 'Inde', flag: '🇮🇳', cuisine: 'indienne',
    name: 'Biryani', tag: 'Festif',
    desc: 'Riz basmati parfumé au safran, couches de viande marinée, oignons frits et raisins secs.',
    gradient: 'linear-gradient(145deg, #f57f17 0%, #ff8f00 50%, #ffe082 100%)',
    accent: '#ff8f00', size: 'small',
  },
  {
    id: 24, country: 'Inde', flag: '🇮🇳', cuisine: 'indienne',
    name: 'Samosa', tag: 'Street food',
    desc: 'Chaussons frits croustillants farcis de pommes de terre épicées, pois et gingembre.',
    gradient: 'linear-gradient(145deg, #f9a825 0%, #ff6f00 50%, #e65100 100%)',
    accent: '#e65100', size: 'small',
  },

  // MAROC
  {
    id: 25, country: 'Maroc', flag: '🇲🇦', cuisine: 'marocaine',
    name: 'Tajine d\'Agneau', tag: 'Emblématique',
    desc: 'Agneau fondant aux pruneaux et amandes, mijoté dans le tajine en terre cuite avec miel et épices.',
    gradient: 'linear-gradient(145deg, #b71c1c 0%, #c62828 50%, #f4a828 100%)',
    accent: '#c62828', size: 'large',
  },
  {
    id: 26, country: 'Maroc', flag: '🇲🇦', cuisine: 'marocaine',
    name: 'Pastilla au Poulet', tag: 'Fête',
    desc: 'Feuilleté de pâte filo fourré de poulet effiloché, œufs brouillés, amandes et cannelle.',
    gradient: 'linear-gradient(145deg, #4a148c 0%, #6a1b9a 50%, #f4a828 100%)',
    accent: '#6a1b9a', size: 'small',
  },
  {
    id: 27, country: 'Maroc', flag: '🇲🇦', cuisine: 'marocaine',
    name: 'Harira', tag: 'Ramadan',
    desc: 'Soupe de tomates, lentilles, pois chiches et coriandre fraîche. Incontournable au coucher du soleil.',
    gradient: 'linear-gradient(145deg, #e65100 0%, #bf360c 50%, #d84315 100%)',
    accent: '#d84315', size: 'small',
  },

  // CÔTE D'IVOIRE
  {
    id: 28, country: "Côte d'Ivoire", flag: '🇨🇮', cuisine: 'ivoirienne',
    name: 'Alloco', tag: 'Street food',
    desc: 'Bananes plantains mûres frites dans de l\'huile de palme, servies avec oignons et piment.',
    gradient: 'linear-gradient(145deg, #e65100 0%, #ff6f00 50%, #ffd54f 100%)',
    accent: '#ff6f00', size: 'small',
  },
  {
    id: 29, country: "Côte d'Ivoire", flag: '🇨🇮', cuisine: 'ivoirienne',
    name: 'Kedjenou', tag: 'Traditionnel',
    desc: 'Poulet mijoté à l\'étouffée dans son jus avec gombos et épices, sans matière grasse ajoutée.',
    gradient: 'linear-gradient(145deg, #33691e 0%, #558b2f 50%, #8bc34a 100%)',
    accent: '#558b2f', size: 'large',
  },

  // TURQUIE
  {
    id: 30, country: 'Turquie', flag: '🇹🇷', cuisine: 'turque',
    name: 'Kebab Adana', tag: 'Grill',
    desc: 'Hachis d\'agneau épicé modelé sur brochette large, grillé sur charbon et servi avec lavash.',
    gradient: 'linear-gradient(145deg, #b71c1c 0%, #d32f2f 50%, #ff5252 100%)',
    accent: '#d32f2f', size: 'small',
  },
  {
    id: 31, country: 'Turquie', flag: '🇹🇷', cuisine: 'turque',
    name: 'Börek', tag: 'Pâtisserie',
    desc: 'Feuilleté de pâte yufka farci au fromage blanc, épinards ou viande, doré au four.',
    gradient: 'linear-gradient(145deg, #f57f17 0%, #fbc02d 50%, #fff176 100%)',
    accent: '#fbc02d', size: 'small',
  },

  // BRÉSIL
  {
    id: 32, country: 'Brésil', flag: '🇧🇷', cuisine: 'bresilienne',
    name: 'Feijoada', tag: 'Plat national',
    desc: 'Ragoût de haricots noirs et viandes fumées — saucisses, jarret, oreilles — servi sur riz blanc.',
    gradient: 'linear-gradient(145deg, #1b5e20 0%, #2e7d32 50%, #0d47a1 100%)',
    accent: '#2e7d32', size: 'large',
  },
  {
    id: 33, country: 'Brésil', flag: '🇧🇷', cuisine: 'bresilienne',
    name: 'Coxinha', tag: 'Street food',
    desc: 'Croquettes en forme de cuisse de poulet, fourrées de poulet effiloché et fromage à la crème.',
    gradient: 'linear-gradient(145deg, #f9a825 0%, #ff8f00 50%, #e65100 100%)',
    accent: '#ff8f00', size: 'small',
  },
]

const COUNTRIES = ['Tous', ...Array.from(new Set(DISHES.map(d => d.country)))]
const REGIONS = {
  'Tous': COUNTRIES.slice(1),
  'Afrique': ['Sénégal', 'Nigéria', "Côte d'Ivoire", 'Maroc'],
  'Moyen-Orient': ['Liban', 'Syrie', 'Turquie'],
  'Asie': ['Chine', 'Inde'],
  'Europe': ['France', 'Italie'],
  'Amériques': ['Brésil'],
}

/* ─── DISH CARD ─────────────────────────────────────────── */
function DishCard({ dish, onClick }) {
  const isLarge = dish.size === 'large'
  return (
    <button
      onClick={() => onClick(dish)}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer text-left transition-all duration-300
        hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]
        ${isLarge ? 'row-span-2' : 'row-span-1'}`}
      style={{ background: dish.gradient }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Dish visual — abstract food shape */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
        <div className="w-32 h-32 rounded-full border-4 border-white/30"
          style={{ boxShadow: `0 0 60px ${dish.accent}` }} />
        <div className="absolute w-20 h-20 rounded-full border-2 border-white/20" />
      </div>

      {/* Badge */}
      <div className="absolute top-4 left-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
          {dish.tag}
        </span>
      </div>

      {/* Flag */}
      <div className="absolute top-4 right-4 text-xl">{dish.flag}</div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{dish.country}</div>
        <h3 className={`font-serif font-bold text-white leading-tight ${isLarge ? 'text-2xl' : 'text-lg'}`}>
          {dish.name}
        </h3>
        {isLarge && (
          <p className="text-white/70 text-xs mt-2 leading-relaxed line-clamp-2">{dish.desc}</p>
        )}
        <div className="flex items-center gap-1 mt-3 text-white/50 text-xs font-semibold group-hover:text-white/80 transition-colors">
          Voir les restaurants <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  )
}

/* ─── MODAL ──────────────────────────────────────────────── */
function DishModal({ dish, onClose }) {
  if (!dish) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-dark2 rounded-3xl overflow-hidden w-full max-w-lg shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Visual header */}
        <div className="h-52 relative" style={{ background: dish.gradient }}>
          <div className="absolute inset-0 bg-gradient-to-t from-dark2/80 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <div className="w-40 h-40 rounded-full border-4 border-white/30"
              style={{ boxShadow: `0 0 80px ${dish.accent}` }} />
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <X size={16} />
          </button>
          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{dish.flag}</span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{dish.country}</span>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/80">{dish.tag}</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-white">{dish.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-muted text-sm leading-relaxed mb-6">{dish.desc}</p>
          <Link
            to={`/restaurants?cuisine=${dish.cuisine}`}
            onClick={onClose}
            className="btn btn-gold w-full justify-center"
          >
            Voir les restaurants {dish.flag} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── PAGE ───────────────────────────────────────────────── */
export default function Galerie() {
  const ref = useScrollReveal()
  const [activeCountry, setActiveCountry] = useState('Tous')
  const [activeRegion,  setActiveRegion]  = useState('Tous')
  const [search,        setSearch]        = useState('')
  const [selected,      setSelected]      = useState(null)
  const gridRef = useRef(null)

  const filtered = DISHES.filter(d => {
    const matchCountry = activeCountry === 'Tous' || d.country === activeCountry
    const matchRegion  = activeRegion  === 'Tous' || REGIONS[activeRegion]?.includes(d.country)
    const matchSearch  = !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      d.tag.toLowerCase().includes(search.toLowerCase())
    return matchCountry && matchRegion && matchSearch
  })

  function selectRegion(r) {
    setActiveRegion(r)
    setActiveCountry('Tous')
  }

  return (
    <>
      <div ref={ref}>
        {/* ── Hero ── */}
        <div className="bg-dark pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 zellige-pattern opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark/80" />
          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <p className="section-label" data-reveal>Galerie mondiale</p>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white mb-4" data-reveal data-delay="0.1s">
              Les Plats du <em className="text-gold italic">Monde</em>
            </h1>
            <p className="text-light/70 text-lg mb-8" data-reveal data-delay="0.2s">
              {DISHES.length} plats emblématiques de {COUNTRIES.length - 1} pays, tous disponibles ici au Maroc.
            </p>
            {/* Search */}
            <div className="relative max-w-sm mx-auto" data-reveal data-delay="0.3s">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un plat ou un pays…"
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-white text-sm
                           placeholder:text-white/35 focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-dark/95 sticky top-[72px] z-40 border-b border-white/[0.06] py-4 shadow-lg">
          <div className="max-w-6xl mx-auto px-6 space-y-3">
            {/* Regions */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(REGIONS).map(r => (
                <button key={r} onClick={() => selectRegion(r)}
                  className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full transition-all duration-200
                    ${activeRegion === r
                      ? 'bg-gold text-dark'
                      : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  {r}
                </button>
              ))}
            </div>
            {/* Countries */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {COUNTRIES.map(c => (
                <button key={c} onClick={() => { setActiveCountry(c); setActiveRegion('Tous') }}
                  className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap
                    ${activeCountry === c
                      ? 'bg-white text-dark'
                      : 'bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="bg-dark min-h-screen py-12">
          <div className="max-w-6xl mx-auto px-6" ref={gridRef}>
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted text-lg mb-4">Aucun plat trouvé pour "{search}"</p>
                <button onClick={() => setSearch('')} className="btn btn-gold text-sm">Effacer la recherche</button>
              </div>
            ) : (
              <>
                <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-6">
                  {filtered.length} plat{filtered.length > 1 ? 's' : ''}
                  {activeCountry !== 'Tous' ? ` · ${activeCountry}` : ''}
                  {activeRegion !== 'Tous' ? ` · ${activeRegion}` : ''}
                </p>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  style={{ gridAutoRows: '200px' }}
                >
                  {filtered.map(dish => (
                    <DishCard key={dish.id} dish={dish} onClick={setSelected} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="bg-dark2 py-16 text-center border-t border-white/[0.05]">
          <div className="max-w-xl mx-auto px-6" data-reveal>
            <h2 className="font-serif text-2xl font-bold text-white mb-3">
              Vous cuisinez l'un de ces plats ?
            </h2>
            <p className="text-muted text-sm mb-6">
              Rejoignez DiaTable et faites découvrir votre cuisine à des milliers d'expatriés au Maroc.
            </p>
            <Link to="/inscription?role=vendor" className="btn btn-gold">
              Devenir vendeur <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && <DishModal dish={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
