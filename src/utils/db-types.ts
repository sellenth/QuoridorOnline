export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      friends: {
        Row: {
          accepted: boolean | null
          friend_id: string
          friends_since: string | null
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          friend_id: string
          friends_since?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          friend_id?: string
          friends_since?: string | null
          user_id?: string
        }
      }
      "game-invites": {
        Row: {
          cols: number
          gid: string | null
          initiated: string | null
          initiator_id: string
          layers: number
          opponent_id: string
          rows: number
          start_fences: number
        }
        Insert: {
          cols?: number
          gid?: string | null
          initiated?: string | null
          initiator_id: string
          layers?: number
          opponent_id: string
          rows?: number
          start_fences?: number
        }
        Update: {
          cols?: number
          gid?: string | null
          initiated?: string | null
          initiator_id?: string
          layers?: number
          opponent_id?: string
          rows?: number
          start_fences?: number
        }
      }
      games: {
        Row: {
          cols: number
          id: string
          layers: number
          move_num: number | null
          moves: number[] | null
          p1_id: string | null
          p2_id: string | null
          rows: number
          start_fences: number
          winner: string | null
        }
        Insert: {
          cols?: number
          id: string
          layers?: number
          move_num?: number | null
          moves?: number[] | null
          p1_id?: string | null
          p2_id?: string | null
          rows?: number
          start_fences?: number
          winner?: string | null
        }
        Update: {
          cols?: number
          id?: string
          layers?: number
          move_num?: number | null
          moves?: number[] | null
          p1_id?: string | null
          p2_id?: string | null
          rows?: number
          start_fences?: number
          winner?: string | null
        }
      }
      users: {
        Row: {
          elo: number | null
          email: string
          id: string
          member_since: string | null
          username: string
        }
        Insert: {
          elo?: number | null
          email: string
          id: string
          member_since?: string | null
          username: string
        }
        Update: {
          elo?: number | null
          email?: string
          id?: string
          member_since?: string | null
          username?: string
        }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

