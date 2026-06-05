import { getWishlist } from "./actions";
import WishlistClient from "./WishlistClient";

export default async function WishlistPage() {
  const wishlist = await getWishlist();
  return <WishlistClient initialWishlist={wishlist} />;
}
