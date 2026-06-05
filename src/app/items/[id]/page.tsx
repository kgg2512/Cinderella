import ItemDetailPageClient from "./ItemDetailPageClient";

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export const dynamicParams = false;

export default function ItemDetailPage() {
  return <ItemDetailPageClient />;
}
