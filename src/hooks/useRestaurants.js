import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RESTAURANTS } from '../data/restaurants'

/**
 * Fetches restaurants from Supabase when configured,
 * falls back to local seed data in demo / dev mode.
 */
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState(RESTAURANTS)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!supabase) return // no env vars — use local data

    setLoading(true)
    supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else if (data?.length) {
          setRestaurants(data)
        }
        setLoading(false)
      })
  }, [])

  return { restaurants, loading, error }
}
