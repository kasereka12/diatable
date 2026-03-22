import { Utensils, UtensilsCrossed, Coffee, Sandwich, Flame, ChefHat, Pizza } from 'lucide-react'

export const CUISINE_ICON_MAP = {
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

export function getCuisineIcon(cuisine) {
  return CUISINE_ICON_MAP[cuisine] || Utensils
}
