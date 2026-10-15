export function movementTypeLabel(type: string): string {
  switch (type) {
    case 'OPENING_BALANCE': return 'Starting Stock';
    case 'PURCHASE': return 'Restock';
    case 'ORDER': return 'Used in Order';
    case 'REVERSAL': return 'Order Cancelled';
    case 'ADJUSTMENT_IN': return 'Correction (+)';
    case 'ADJUSTMENT_OUT': return 'Correction (-)';
    default: return 'Other change';
  }
}

export function movementNote(movement: { movement_type?: string; reference_id?: string | number | null; reason?: string | null }): string {
  const type = movement.movement_type;
  const refId = movement.reference_id;
  const reason = movement.reason;

  switch (type) {
    case 'OPENING_BALANCE':
      return 'Initial stock when the item was created';
    case 'PURCHASE':
      return refId ? `Purchase #${refId}` : 'Purchase';
    case 'ORDER':
      return refId ? `Order #${refId}` : 'Order';
    case 'REVERSAL':
      return refId ? `Order #${refId} was cancelled` : 'Order was cancelled';
    case 'ADJUSTMENT_IN':
    case 'ADJUSTMENT_OUT':
      return reason && reason.trim() ? reason : '-';
    default:
      return reason && reason.trim() ? reason : '-';
  }
}

export function categoryLabel(category: string): string {
  const norm = category.toLowerCase();
  if (norm === 'bahan_baku' || norm === 'bahan') return 'Ingredient';
  if (norm === 'kemasan') return 'Packaging';
  return category;
}

export function purchaseStatusLabel(isReceived: boolean): string {
  return isReceived ? 'Received' : 'Waiting for Delivery';
}

export function friendlyError(err: unknown): string {
  console.error(err);
  
  try {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    let msg = '';
    
    if (typeof detail === 'string') {
      msg = detail.toLowerCase();
    } else if (Array.isArray(detail)) {
      msg = detail.map(d => String(d.msg || d.type || '').toLowerCase()).join(' ');
    } else if (err instanceof Error) {
      msg = err.message.toLowerCase();
    }
    
    // Map known cases
    if (msg.includes('history') || msg.includes('movement') || msg.includes('movementout')) {
      return "This ingredient has stock history, so it can't be deleted.";
    }
    if (msg.includes('supplier') && (msg.includes('purchase') || msg.includes('has'))) {
      return "This supplier has purchases, so it can't be deleted.";
    }
    if (msg.includes('already received')) {
      return "This purchase was already received.";
    }
    if (msg.includes('negative') || msg.includes('below zero') || msg.includes('kurang') || msg.includes('minus')) {
      return "Stock can't go below zero.";
    }
    if ((err as { response?: { status?: number } })?.response?.status === 422 || (Array.isArray(detail))) {
      return "Please check the form and try again.";
    }
    if (!msg || msg.includes('network error') || msg.includes('failed to fetch')) {
      return "Can't reach the server. Please try again.";
    }
  } catch (e) {
    console.error("Error parsing backend error", e);
  }
  
  return "Something went wrong. Please try again.";
}
