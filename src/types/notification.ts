export interface NotificationItem {
  id: number;
  recipient_buyer_id?: number | null;
  recipient_user_id?: number | null;
  type: string;
  order_id?: number | null;
  actor_type?: string | null;
  actor_id?: number | null;
  metadata_json?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationMetadata {
  order_id?: number;
  order_number?: string;
  status?: string;
  old_status?: string;
  total_price?: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
