import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRestaurantDetail(id) {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems,  setMenuItems]  = useState([])
  const [reviews,    setReviews]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    if (!id) return

    if (!supabase) {
      setLoading(false)
      setError('Supabase non configuré.')
      return
    }

    setLoading(true)
    setError(null)

    Promise.all([
      supabase.from('restaurants').select('*').eq('id', id).single(),
      supabase.from('menu_items').select('*').eq('restaurant_id', id).eq('is_available', true).order('category'),
      supabase.from('reviews').select('*, profiles(full_name)').eq('restaurant_id', id).order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: r, error: re }, { data: m, error: me }, { data: rv, error: rve }]) => {
      if (re) {
        setError(re.message)
      } else {
        setRestaurant(r)
      }

      setMenuItems(me ? [] : (m || []))

      setReviews(rve ? [] : (rv || []).map(review => ({
        ...review,
        initials: (review.profiles?.full_name || 'U')
          .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        name: review.profiles?.full_name || 'Utilisateur',
        date: new Date(review.created_at).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      })))

      setLoading(false)
    })
  }, [id])

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Plats Principaux'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return { restaurant, menuByCategory, reviews, loading, error }
}
