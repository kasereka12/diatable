import { Utensils, UtensilsCrossed, Coffee, Sandwich, Flame, ChefHat, Pizza, type LucideIcon } from 'lucide-react'

export const CUISINE_ICON_MAP: Record<string, LucideIcon> = {
  senegalaise:  Utensils,
  chinoise:     UtensilsCrossed,
  libanaise:    Utensils,
  syrienne:     Sandwich,
  francaise:    Coffee,
  italienne:    Pizza,
  nigeriane:    Flame,
  indienne:     Flame,
  bresilienne:  Utensils,
  ivoirienne:   Utensils,
  marocaine:    ChefHat,
  turque:       Sandwich,
}

export function getCuisineIcon(cuisine: string | null | undefined): LucideIcon {
  return (cuisine && CUISINE_ICON_MAP[cuisine]) || Utensils
}
