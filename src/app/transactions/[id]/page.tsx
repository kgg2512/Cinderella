import TransactionDetailClient from "./TransactionDetailClient";

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export const dynamicParams = false;

export default function TransactionDetailPage() {
  return <TransactionDetailClient />;
}
