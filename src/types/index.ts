export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type ItemStatus = "available" | "rented" | "hidden";
export type RequestStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export type ItemCategory =
  | "bags"
  | "clothing"
  | "shoes"
  | "accessories"
  | "jewelry"
  | "watches"
  | "other";

export interface Item {
  id: string;
  user_id: string;
  title: string;
  brand: string | null;
  category: ItemCategory;
  price_per_day: number;
  description: string | null;
  images: string[];
  status: ItemStatus;
  created_at: string;
  // joined
  owner?: User;
}

export interface RentalRequest {
  id: string;
  item_id: string;
  requester_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  // joined
  item?: Item;
  requester?: User;
  owner?: User;
}

export interface Wishlist {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  // joined
  item?: Item;
}

export interface FairyRating {
  average: number;
  total_reviews: number;
  transaction_count: number;
  response_rate: number;
}
