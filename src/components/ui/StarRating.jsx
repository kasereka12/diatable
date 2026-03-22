import { Star } from 'lucide-react'

export default function StarRating({ rating, max = 5, size = 13 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'text-gold fill-gold' : 'text-gold/30 fill-transparent'}
        />
      ))}
    </span>
  )
}
