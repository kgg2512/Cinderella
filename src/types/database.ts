export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          brand: string | null;
          category: string;
          price_per_day: number;
          description: string | null;
          images: string[];
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          brand?: string | null;
          category: string;
          price_per_day: number;
          description?: string | null;
          images?: string[];
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          brand?: string | null;
          category?: string;
          price_per_day?: number;
          description?: string | null;
          images?: string[];
          status?: string;
          created_at?: string;
        };
      };
      rental_requests: {
        Row: {
          id: string;
          item_id: string;
          requester_id: string;
          owner_id: string;
          start_date: string;
          end_date: string;
          status: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          requester_id: string;
          owner_id: string;
          start_date: string;
          end_date: string;
          status?: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          requester_id?: string;
          owner_id?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          message?: string | null;
          created_at?: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
