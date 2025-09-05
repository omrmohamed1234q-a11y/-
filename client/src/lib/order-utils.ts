// Order status utilities with Egyptian Arabic text

export const ORDER_STATUSES = {
  new: "مش مستلمة من الموظف",
  staff_received: "استلمها الموظف",
  printing: "جاري الطباعة دلوقتي",
  ready_pickup: "جاهزة في الفرع - تعالى خدها",
  ready_delivery: "جاهزة للتوصيل",
  driver_assigned: "راح للكابتن",
  out_for_delivery: "الكابتن في الطريق إليك",
  delivered: "وصلت خلاص - تم التسليم",
  cancelled: "تم الإلغاء"
} as const;

export const ORDER_STATUS_COLORS = {
  new: "text-red-600 bg-red-50",
  staff_received: "text-blue-600 bg-blue-50",
  printing: "text-orange-600 bg-orange-50",
  ready_pickup: "text-green-600 bg-green-50",
  ready_delivery: "text-purple-600 bg-purple-50",
  driver_assigned: "text-indigo-600 bg-indigo-50",
  out_for_delivery: "text-yellow-600 bg-yellow-50",
  delivered: "text-emerald-600 bg-emerald-50",
  cancelled: "text-gray-600 bg-gray-50"
} as const;

export const ORDER_STATUS_ICONS = {
  new: "📝",
  staff_received: "👥",
  printing: "🖨️",
  ready_pickup: "📦",
  ready_delivery: "🚚",
  driver_assigned: "🏍️",
  out_for_delivery: "🛵",
  delivered: "✅",
  cancelled: "❌"
} as const;

export const DELIVERY_METHOD_TEXT = {
  pickup: "استلام من الفرع",
  delivery: "توصيل للمنزل"
} as const;

export const PAYMENT_METHOD_TEXT = {
  vodafone_cash: "فودافون كاش",
  orange_money: "اورنچ موني",
  etisalat_cash: "اتصالات كاش",
  valu: "فاليو",
  card: "بطاقة ائتمانية",
  cash: "كاش"
} as const;

export function getOrderStatusText(status: keyof typeof ORDER_STATUSES): string {
  return ORDER_STATUSES[status] || "حالة غير معروفة";
}

export function getOrderStatusColor(status: keyof typeof ORDER_STATUS_COLORS): string {
  return ORDER_STATUS_COLORS[status] || "text-gray-600 bg-gray-50";
}

export function getOrderStatusIcon(status: keyof typeof ORDER_STATUS_ICONS): string {
  return ORDER_STATUS_ICONS[status] || "📋";
}

export function canUpdateOrderStatus(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    new: ["staff_received", "cancelled"],
    staff_received: ["printing", "cancelled"],
    printing: ["ready_pickup", "ready_delivery", "cancelled"],
    ready_pickup: ["delivered", "cancelled"],
    ready_delivery: ["driver_assigned", "cancelled"],
    driver_assigned: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

export function getOrderTimeline(order: any): Array<{event: string, timestamp: Date, note?: string}> {
  const timeline = [];
  
  if (order.createdAt) {
    timeline.push({
      event: "تم إنشاء الطلب",
      timestamp: new Date(order.createdAt)
    });
  }
  
  if (order.receivedAt) {
    timeline.push({
      event: `استلم الطلب: ${order.staffName || 'الموظف'}`,
      timestamp: new Date(order.receivedAt)
    });
  }
  
  if (order.printingStartedAt) {
    timeline.push({
      event: "بدء الطباعة",
      timestamp: new Date(order.printingStartedAt)
    });
  }
  
  if (order.printingCompletedAt) {
    timeline.push({
      event: "انتهت الطباعة",
      timestamp: new Date(order.printingCompletedAt)
    });
  }
  
  if (order.readyAt) {
    timeline.push({
      event: order.deliveryMethod === 'pickup' ? "جاهز للاستلام" : "جاهز للتوصيل",
      timestamp: new Date(order.readyAt)
    });
  }
  
  if (order.outForDeliveryAt) {
    timeline.push({
      event: `خرج للتوصيل مع ${order.driverName || 'الكابتن'}`,
      timestamp: new Date(order.outForDeliveryAt)
    });
  }
  
  if (order.deliveredAt) {
    timeline.push({
      event: "تم التسليم بنجاح",
      timestamp: new Date(order.deliveredAt)
    });
  }
  
  if (order.cancelledAt) {
    timeline.push({
      event: "تم إلغاء الطلب",
      timestamp: new Date(order.cancelledAt)
    });
  }
  
  // Add custom timeline events from JSON field
  if (order.timeline && Array.isArray(order.timeline)) {
    timeline.push(...order.timeline.map((item: any) => ({
      event: item.event,
      timestamp: new Date(item.timestamp),
      note: item.note
    })));
  }
  
  return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}