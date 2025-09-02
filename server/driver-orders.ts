// Mock driver orders for the secure dashboard

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: string[];
  totalPrice: number;
  status: string;
  priority: 'low' | 'normal' | 'high';
  securityLevel: 'standard' | 'secure' | 'confidential';
  createdAt: string;
  estimatedDelivery?: string;
}

export class DriverOrdersService {
  private orders: Order[] = [
    {
      id: 'ORD-001',
      customerName: 'أحمد محمد',
      customerPhone: '01012345678',
      deliveryAddress: 'شارع النيل، المعادي، القاهرة',
      items: ['كتاب الرياضيات - الصف الثالث الثانوي', 'مذكرة الفيزياء'],
      totalPrice: 150,
      status: 'pending',
      priority: 'normal',
      securityLevel: 'standard',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ORD-002', 
      customerName: 'فاطمة علي',
      customerPhone: '01098765432',
      deliveryAddress: 'شارع الجمهورية، وسط البلد، القاهرة',
      items: ['أوراق امتحان', 'شهادات'],
      totalPrice: 75,
      status: 'pending',
      priority: 'high',
      securityLevel: 'confidential',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ORD-003',
      customerName: 'محمد حسن',
      customerPhone: '01156789012',
      deliveryAddress: 'شارع التحرير، الدقي، الجيزة',
      items: ['كتب مدرسية متنوعة'],
      totalPrice: 200,
      status: 'accepted',
      priority: 'normal',
      securityLevel: 'standard',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 90 * 60 * 1000).toISOString()
    }
  ];

  async getAllOrders(): Promise<Order[]> {
    return this.orders;
  }

  async acceptOrder(orderId: string, driverId: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex].status = 'accepted';
    console.log(`Order ${orderId} accepted by driver ${driverId}`);
    return true;
  }

  async markAsDelivered(orderId: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return false;

    this.orders[orderIndex].status = 'delivered';
    console.log(`Order ${orderId} marked as delivered`);
    return true;
  }

  async updateDriverStatus(driverId: string, status: 'offline' | 'online' | 'busy'): Promise<boolean> {
    console.log(`Driver ${driverId} status updated to: ${status}`);
    return true;
  }
}

export const driverOrdersService = new DriverOrdersService();