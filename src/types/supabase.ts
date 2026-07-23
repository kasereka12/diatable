// Auto-generated from supabase/schema.sql and migrations.
// Re-generate with: supabase gen types typescript --linked > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'client' | 'vendor' | 'admin' | 'driver'
          status: 'active' | 'suspended' | 'banned'
          email: string | null
          avatar_url: string | null
          created_at: string
          rib: string | null
          bank_name: string | null
          account_name: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'client' | 'vendor' | 'admin'
          status?: 'active' | 'suspended' | 'banned'
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          rib?: string | null
          bank_name?: string | null
          account_name?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      restaurants: {
        Row: {
          id: string
          owner_id: string | null
          type: 'restaurant' | 'homecook' | 'popup'
          name: string
          cuisine: string
          cuisine_label: string
          flag: string
          emoji: string
          gradient: string
          location: string
          address: string | null
          description: string | null
          hours: string | null
          phone: string | null
          whatsapp: string | null
          instagram: string | null
          image_url: string | null
          rating: number | null
          reviews: number
          is_verified: boolean
          is_active: boolean
          is_open: boolean
          is_home_featured: boolean
          deactivated_by_suspension: boolean
          created_at: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          type?: 'restaurant' | 'homecook' | 'popup'
          name: string
          cuisine: string
          cuisine_label: string
          flag: string
          emoji: string
          gradient: string
          location: string
          address?: string | null
          description?: string | null
          hours?: string | null
          phone?: string | null
          whatsapp?: string | null
          instagram?: string | null
          image_url?: string | null
          rating?: number | null
          reviews?: number
          is_verified?: boolean
          is_active?: boolean
          is_open?: boolean
          is_home_featured?: boolean
          deactivated_by_suspension?: boolean
          created_at?: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string | null
          category: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_popular: boolean
          is_available: boolean
          prep_time_min: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          category?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_popular?: boolean
          is_available?: boolean
          prep_time_min?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          restaurant_id: string | null
          user_id: string | null
          rating: number
          text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          user_id?: string | null
          rating: number
          text?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          restaurant_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          payment_method: 'cash_on_delivery' | 'card' | 'mobile_payment'
          payment_status: 'pending' | 'paid' | 'refunded'
          subtotal: number
          delivery_fee: number
          total: number
          delivery_address: string | null
          delivery_phone: string | null
          delivery_notes: string | null
          customer_name: string | null
          estimated_time: number | null
          delivery_mode: 'delivery' | 'pickup'
          delivery_zone: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          estimated_delivery_at: string | null
          estimated_prep_min: number | null
          driver_id: string | null
          driver_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          restaurant_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          payment_method?: 'cash_on_delivery' | 'card' | 'mobile_payment'
          payment_status?: 'pending' | 'paid' | 'refunded'
          subtotal?: number
          delivery_fee?: number
          total?: number
          delivery_address?: string | null
          delivery_phone?: string | null
          delivery_notes?: string | null
          customer_name?: string | null
          estimated_time?: number | null
          delivery_mode?: 'delivery' | 'pickup'
          delivery_zone?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          estimated_delivery_at?: string | null
          estimated_prep_min?: number | null
          driver_id?: string | null
          driver_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      delivery_drivers: {
        Row: {
          id: string
          profile_id: string | null
          type: 'external' | 'restaurant'
          restaurant_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          vehicle_type: 'moto' | 'voiture' | 'velo' | 'pieton' | null
          is_active: boolean
          is_available: boolean
          is_suspended: boolean
          deactivated_by_suspension: boolean
          current_lat: number | null
          current_lng: number | null
          location_updated_at: string | null
          license_number: string | null
          license_photo_url: string | null
          vehicle_brand: string | null
          vehicle_plate: string | null
          photo_front: string | null
          photo_back: string | null
          photo_left: string | null
          photo_right: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          type: 'external' | 'restaurant'
          restaurant_id?: string | null
          full_name: string
          phone?: string | null
          email?: string | null
          vehicle_type?: 'moto' | 'voiture' | 'velo' | 'pieton' | null
          is_active?: boolean
          is_available?: boolean
          is_suspended?: boolean
          deactivated_by_suspension?: boolean
          current_lat?: number | null
          current_lng?: number | null
          location_updated_at?: string | null
          license_number?: string | null
          license_photo_url?: string | null
          vehicle_brand?: string | null
          vehicle_plate?: string | null
          photo_front?: string | null
          photo_back?: string | null
          photo_left?: string | null
          photo_right?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['delivery_drivers']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          menu_item_id?: string | null
          name: string
          price: number
          quantity?: number
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          customer_id: string | null
          vendor_id: string | null
          restaurant_id: string | null
          order_id: string | null
          last_message: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          vendor_id?: string | null
          restaurant_id?: string | null
          order_id?: string | null
          last_message?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          sender_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: 'order' | 'message' | 'review' | 'system' | 'info'
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type?: 'order' | 'message' | 'review' | 'system' | 'info'
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          vendor_id: string | null
          plan: 'free' | 'pro' | 'premium'
          status: 'active' | 'expired' | 'cancelled'
          started_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          plan?: 'free' | 'pro' | 'premium'
          status?: 'active' | 'expired' | 'cancelled'
          started_at?: string
          expires_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      subscription_payments: {
        Row: {
          id: string
          vendor_id: string | null
          plan: 'pro' | 'premium'
          bank: string
          reference: string
          sender_name: string
          receipt_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          plan: 'pro' | 'premium'
          bank: string
          reference: string
          sender_name: string
          receipt_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscription_payments']['Insert']>
      }
      delivery_zones: {
        Row: {
          id: string
          restaurant_id: string | null
          quartier: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          quartier: string
          price?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['delivery_zones']['Insert']>
      }
      restaurant_likes: {
        Row: {
          id: string
          restaurant_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['restaurant_likes']['Insert']>
      }
      restaurant_views: {
        Row: {
          id: string
          restaurant_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['restaurant_views']['Insert']>
      }
      testimonials: {
        Row: {
          id: string
          initials: string
          name: string
          origin: string
          text: string
          rating: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          initials: string
          name: string
          origin: string
          text: string
          rating?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>
      }
      dishes: {
        Row: {
          id: string
          country: string
          flag: string
          cuisine: string
          name: string
          tag: string
          description: string | null
          gradient: string | null
          accent: string | null
          size: 'small' | 'large'
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          country: string
          flag: string
          cuisine: string
          name: string
          tag: string
          description?: string | null
          gradient?: string | null
          accent?: string | null
          size?: 'small' | 'large'
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['dishes']['Insert']>
      }
      team: {
        Row: {
          id: string
          initials: string
          name: string
          role: string
          origin: string | null
          bio: string | null
          avatar_bg: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          initials: string
          name: string
          role: string
          origin?: string | null
          bio?: string | null
          avatar_bg?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['team']['Insert']>
      }
    }
    Views: {
      vendeurs_stats: {
        Row: {
          restaurant_id: string
          review_count: number
          avg_rating: number | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Convenience row types ─────────────────────────────────────────────────────
export type Profile             = Database['public']['Tables']['profiles']['Row']
export type Restaurant          = Database['public']['Tables']['restaurants']['Row']
export type MenuItem            = Database['public']['Tables']['menu_items']['Row']
export type Review              = Database['public']['Tables']['reviews']['Row']
export type Order               = Database['public']['Tables']['orders']['Row']
export type OrderItem           = Database['public']['Tables']['order_items']['Row']
export type Conversation        = Database['public']['Tables']['conversations']['Row']
export type Message             = Database['public']['Tables']['messages']['Row']
export type Notification        = Database['public']['Tables']['notifications']['Row']
export type Subscription        = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionPayment = Database['public']['Tables']['subscription_payments']['Row']
export type DeliveryZone        = Database['public']['Tables']['delivery_zones']['Row']
export type DeliveryDriver      = Database['public']['Tables']['delivery_drivers']['Row']
export type RestaurantLike      = Database['public']['Tables']['restaurant_likes']['Row']
export type Testimonial         = Database['public']['Tables']['testimonials']['Row']
export type Dish                = Database['public']['Tables']['dishes']['Row']
export type TeamMember          = Database['public']['Tables']['team']['Row']
export type VendeurStats        = Database['public']['Views']['vendeurs_stats']['Row']

// ── Enriched types used by the app ────────────────────────────────────────────

/** Restaurant enriched with computed rating, review count, and subscription plan */
export interface RestaurantWithPlan extends Restaurant {
  plan: 'free' | 'pro' | 'premium'
}

/** Review enriched with computed display fields */
export interface ReviewWithAuthor extends Review {
  initials: string
  name: string
  date: string
  profiles?: { full_name: string | null } | null
}

/** Restaurant with embedded reviews and menu items (from useVendeurDetail) */
export interface RestaurantDetail extends Omit<Restaurant, 'reviews'> {
  reviews: ReviewWithAuthor[]
  menu_items: MenuItem[]
}

/** Menu items grouped by category */
export type MenuByCategory = Record<string, MenuItem[]>

/** Cart item */
export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}
