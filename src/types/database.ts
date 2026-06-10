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
      transactions: {
        Row: {
          id: string;
          item_id: string;
          lender_id: string;
          borrower_id: string;
          status: string;
          start_date: string;
          end_date: string;
          deposit_amount: number;
          toss_id: string | null;
          lender_confirmed_handover: boolean;
          borrower_confirmed_handover: boolean;
          lender_confirmed_return: boolean;
          borrower_confirmed_return: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          lender_id: string;
          borrower_id: string;
          status?: string;
          start_date: string;
          end_date: string;
          deposit_amount: number;
          toss_id?: string | null;
          lender_confirmed_handover?: boolean;
          borrower_confirmed_handover?: boolean;
          lender_confirmed_return?: boolean;
          borrower_confirmed_return?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          lender_id?: string;
          borrower_id?: string;
          status?: string;
          start_date?: string;
          end_date?: string;
          deposit_amount?: number;
          toss_id?: string | null;
          lender_confirmed_handover?: boolean;
          borrower_confirmed_handover?: boolean;
          lender_confirmed_return?: boolean;
          borrower_confirmed_return?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transaction_photos: {
        Row: {
          id: string;
          transaction_id: string;
          uploaded_by: string;
          photo_type: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          uploaded_by: string;
          photo_type: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          uploaded_by?: string;
          photo_type?: string;
          storage_path?: string;
          created_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          item_id: string;
          borrower_id: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          borrower_id: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          borrower_id?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          read_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
