export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole     = 'admin' | 'manager' | 'viewer'
export type MovementType = 'entry' | 'exit' | 'adjustment'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          full_name:  string | null
          avatar_url: string | null
          role:       UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id:          string
          full_name?:  string | null
          avatar_url?: string | null
          role?:       UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?:  string | null
          avatar_url?: string | null
          role?:       UserRole
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id:          string
          name:        string
          description: string | null
          color:       string
          created_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          description?: string | null
          color?:       string
          created_at?:  string
        }
        Update: {
          name?:        string
          description?: string | null
          color?:       string
        }
      }
      suppliers: {
        Row: {
          id:           string
          name:         string
          contact_name: string | null
          email:        string | null
          phone:        string | null
          address:      string | null
          notes:        string | null
          is_active:    boolean
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          name:          string
          contact_name?: string | null
          email?:        string | null
          phone?:        string | null
          address?:      string | null
          notes?:        string | null
          is_active?:    boolean
          created_at?:   string
          updated_at?:   string
        }
        Update: {
          name?:         string
          contact_name?: string | null
          email?:        string | null
          phone?:        string | null
          address?:      string | null
          notes?:        string | null
          is_active?:    boolean
          updated_at?:   string
        }
      }
      products: {
        Row: {
          id:            string
          name:          string
          sku:           string | null
          description:   string | null
          category_id:   string | null
          supplier_id:   string | null
          unit_price:    number
          current_stock: number
          min_stock:     number
          unit:          string
          image_url:     string | null
          is_active:     boolean
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          name:           string
          sku?:           string | null
          description?:   string | null
          category_id?:   string | null
          supplier_id?:   string | null
          unit_price?:    number
          current_stock?: number
          min_stock?:     number
          unit?:          string
          image_url?:     string | null
          is_active?:     boolean
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          name?:        string
          sku?:         string | null
          description?: string | null
          category_id?: string | null
          supplier_id?: string | null
          unit_price?:  number
          min_stock?:   number
          unit?:        string
          image_url?:   string | null
          is_active?:   boolean
          updated_at?:  string
        }
      }
      stock_movements: {
        Row: {
          id:               string
          product_id:       string
          movement_type:    MovementType
          quantity:         number
          reason:           string | null
          notes:            string | null
          unit_price:       number | null
          reference_number: string | null
          created_by:       string | null
          created_at:       string
        }
        Insert: {
          id?:               string
          product_id:        string
          movement_type:     MovementType
          quantity:          number
          reason?:           string | null
          notes?:            string | null
          unit_price?:       number | null
          reference_number?: string | null
          created_by?:       string | null
          created_at?:       string
        }
        Update: never  // registro fijo
      }
    }
    Views: {
      products_with_details: {
        Row: {
          id:             string
          name:           string
          sku:            string | null
          description:    string | null
          unit_price:     number
          current_stock:  number
          min_stock:      number
          unit:           string
          image_url:      string | null
          is_active:      boolean
          created_at:     string
          updated_at:     string
          category_id:    string | null
          category_name:  string | null
          category_color: string | null
          supplier_id:    string | null
          supplier_name:  string | null
        }
      }
      low_stock_products: {
        Row: {
          id:             string
          name:           string
          sku:            string | null
          current_stock:  number
          min_stock:      number
          unit:           string
          category_name:  string | null
          category_color: string | null
        }
      }
      movements_with_product: {
        Row: {
          id:               string
          product_id:       string
          movement_type:    MovementType
          quantity:         number
          reason:           string | null
          notes:            string | null
          unit_price:       number | null
          reference_number: string | null
          created_by:       string | null
          created_at:       string
          product_name:     string
          product_sku:      string | null
          product_unit:     string
        }
      }
      movement_daily_summary: {
        Row: {
          date:        string
          entries:     number
          exits:       number
          adjustments: number
        }
      }
      category_stock_summary: {
        Row: {
          category_id:    string | null
          category_name:  string | null
          category_color: string | null
          product_count:  number
          stock_value:    number
        }
      }
    }
    Functions: {
      get_my_role: {
        Args:    Record<string, never>
        Returns: string
      }
    }
  }
}
