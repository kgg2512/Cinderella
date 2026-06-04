export type TransactionStatus =
  | 'requested'
  | 'deposit_requested'
  | 'deposit_confirmed'
  | 'handed_over'
  | 'returned'
  | 'completed'
  | 'disputed';

export interface Transaction {
  id: string;
  item_id: string;
  lender_id: string;
  borrower_id: string;
  status: TransactionStatus;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  toss_id?: string | null;
  lender_confirmed_handover: boolean;
  borrower_confirmed_handover: boolean;
  lender_confirmed_return: boolean;
  borrower_confirmed_return: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionPhoto {
  id: string;
  transaction_id: string;
  uploaded_by: string;
  photo_type: 'before_handover' | 'after_return';
  storage_path: string;
  created_at: string;
}

export type TransactionRole = 'lender' | 'borrower';

export interface TransactionWithDetails extends Transaction {
  item?: {
    id: string;
    title: string;
    brand: string | null;
    images: string[];
    price_per_day: number;
  };
  lender?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  borrower?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  photos?: TransactionPhoto[];
}

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  requested: '빌리기 요청',
  deposit_requested: '보증금 요청됨',
  deposit_confirmed: '보증금 확인됨',
  handed_over: '물건 전달됨',
  returned: '반납됨',
  completed: '거래 완료',
  disputed: '분쟁 중',
};

export const TRANSACTION_STATUS_ORDER: TransactionStatus[] = [
  'requested',
  'deposit_requested',
  'deposit_confirmed',
  'handed_over',
  'returned',
  'completed',
];
