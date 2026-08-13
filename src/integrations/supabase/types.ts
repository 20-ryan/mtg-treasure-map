export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      ar_collectibles: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          store_id: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id: string
          name: string
          rarity?: string
          store_id: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          store_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "ar_collectibles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          cadence: string
          created_at: string
          description: string
          id: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          cadence: string
          created_at?: string
          description: string
          id: string
          requirement_type: string
          requirement_value: number
          title: string
          xp_reward?: number
        }
        Update: {
          cadence?: string
          created_at?: string
          description?: string
          id?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          colors: string[]
          created_at: string
          id: string
          image_key: string
          image_url: string | null
          msrp: number
          name: string
          oracle: string
          rarity: string
          set_code: string
          set_name: string
          type_line: string
        }
        Insert: {
          category: string
          colors?: string[]
          created_at?: string
          id: string
          image_key?: string
          image_url?: string | null
          msrp?: number
          name: string
          oracle?: string
          rarity?: string
          set_code: string
          set_name: string
          type_line?: string
        }
        Update: {
          category?: string
          colors?: string[]
          created_at?: string
          id?: string
          image_key?: string
          image_url?: string | null
          msrp?: number
          name?: string
          oracle?: string
          rarity?: string
          set_code?: string
          set_name?: string
          type_line?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string | null
          favorite_store_id: string | null
          id: string
          level: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string | null
          favorite_store_id?: string | null
          id: string
          level?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string | null
          favorite_store_id?: string | null
          id?: string
          level?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_store_id_fkey"
            columns: ["favorite_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          id: string
          price: number
          product_description: string
          purchase_date: string
          quantity: number
          receipt_image: string | null
          store_id: string | null
          store_name: string
          user_id: string
        }
        Insert: {
          id?: string
          price?: number
          product_description: string
          purchase_date?: string
          quantity?: number
          receipt_image?: string | null
          store_id?: string | null
          store_name?: string
          user_id: string
        }
        Update: {
          id?: string
          price?: number
          product_description?: string
          purchase_date?: string
          quantity?: number
          receipt_image?: string | null
          store_id?: string | null
          store_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_check_ins: {
        Row: {
          check_in_date: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          check_in_date?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          check_in_date?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_check_ins_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_inventory: {
        Row: {
          condition: string
          id: string
          price: number
          product_id: string
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          condition?: string
          id?: string
          price: number
          product_id: string
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          condition?: string
          id?: string
          price?: number
          product_id?: string
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          status: string
          store_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          status?: string
          store_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          status?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_photos_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          area: string
          blurb: string
          created_at: string
          facebook: string | null
          google_maps_url: string
          hours: string
          id: string
          lat: number
          lng: number
          name: string
          phone: string | null
          photos: string[]
          postal_code: string
          rating: number | null
          tags: string[]
          website: string | null
        }
        Insert: {
          address: string
          area: string
          blurb?: string
          created_at?: string
          facebook?: string | null
          google_maps_url?: string
          hours: string
          id: string
          lat: number
          lng: number
          name: string
          phone?: string | null
          photos?: string[]
          postal_code: string
          rating?: number | null
          tags?: string[]
          website?: string | null
        }
        Update: {
          address?: string
          area?: string
          blurb?: string
          created_at?: string
          facebook?: string | null
          google_maps_url?: string
          hours?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          photos?: string[]
          postal_code?: string
          rating?: number | null
          tags?: string[]
          website?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          date_unlocked: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          date_unlocked?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          date_unlocked?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ar_discoveries: {
        Row: {
          collectible_id: string
          discovered_at: string
          id: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          collectible_id: string
          discovered_at?: string
          id?: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          collectible_id?: string
          discovered_at?: string
          id?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ar_discoveries_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "ar_collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ar_discoveries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          period_key: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          period_key: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          period_key?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collections: {
        Row: {
          card_name: string
          collector_number: string | null
          created_at: string
          id: string
          image_url: string | null
          quantity: number
          rarity: string
          set_code: string
          set_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_name: string
          collector_number?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          quantity?: number
          rarity?: string
          set_code?: string
          set_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_name?: string
          collector_number?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          quantity?: number
          rarity?: string
          set_code?: string
          set_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          notify: boolean
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify?: boolean
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify?: boolean
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
