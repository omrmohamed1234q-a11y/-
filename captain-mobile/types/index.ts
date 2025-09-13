/**
 * TypeScript interfaces for Captain Mobile App
 * Defines proper types for orders, captain, location, and other data structures
 */

// Order related types
export type OrderStatus = 
  | 'pending' 
  | 'accepted'
  | 'at_pickup'
  | 'picked_up' 
  | 'in_delivery' 
  | 'delivered' 
  | 'rejected' 
  | 'cancelled';

export type RouteStatus = 
  | 'to_pickup'
  | 'at_pickup'
  | 'to_delivery'
  | 'at_delivery'
  | 'completed';

export type OrderPriority = 'normal' | 'express' | 'urgent';

export type PaymentMethod = 'cash' | 'card' | 'digital_wallet';

// Note: OrderType is redefined below with delivery coordinates

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Captain related types
export interface CaptainType {
  id: string;
  username?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  rating?: number;
  totalDeliveries?: number;
  isAvailable?: boolean;
  status?: 'online' | 'offline' | 'busy';
  location?: LocationType;
  joinDate?: string;
  avatar?: string;
}

// Location related types
export interface LocationType {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface LocationUpdate {
  coords: LocationType;
  timestamp: number;
}

// Stats and analytics types
export interface DailyStatsType {
  orders: number;
  earnings: number;
  distance: number;
  onlineTime: number;
  completedOrders?: number;
  rating?: number;
  totalDeliveries?: number;
}

// WebSocket and connection types
export interface ConnectionState {
  isConnected: boolean;
  isAuthenticated?: boolean;
  error?: string;
}

// Event handler types
export interface AuthChangeEvent {
  isAuthenticated: boolean;
  captain: CaptainType | null;
}

export interface OrderUpdateEvent {
  orderId: string;
  status: OrderStatus;
  statusText?: string;
  captainId?: string;
  timestamp?: number;
  location?: LocationType;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrderResponse extends ApiResponse {
  order?: OrderType;
  orders?: OrderType[];
}

export interface CaptainResponse extends ApiResponse {
  captain?: CaptainType;
}

export interface LocationResponse extends ApiResponse {
  location?: LocationType;
}

export interface StatsResponse extends ApiResponse {
  stats?: DailyStatsType;
}

// Order status configuration
export interface OrderStatusConfig {
  key: string;
  label: string;
  color: string;
}

export interface OrderStatusMap {
  [key: string]: OrderStatusConfig;
}

// Form and UI types
export interface OrderFormData {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  priority?: OrderPriority;
}

// Captain service state type
export interface CaptainServiceState {
  captain: CaptainType | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  orders: OrderType[];
  activeOrder: OrderType | null;
  dailyStats: DailyStatsType;
  connectionState: ConnectionState;
  locationTracking: boolean;
}

// Event handler function types
export type LocationUpdateHandler = (location: LocationType) => void;
export type LocationErrorHandler = (error: any, message?: string) => void;
export type OrderUpdateHandler = (orderData: OrderType) => void;
export type AuthChangeHandler = (authData: AuthChangeEvent) => void;
export type ConnectionChangeHandler = (connectionData: ConnectionState) => void;

// Delivery tracking types
export interface DeliveryRoute {
  id: string;
  orderId: string;
  pickupLocation: LocationType;
  deliveryLocation: LocationType;
  waypoints?: LocationType[];
  distance: number;
  estimatedDuration: number;
  currentStatus: 'to_pickup' | 'at_pickup' | 'to_delivery' | 'at_delivery' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  direction: 'left' | 'right' | 'straight' | 'u-turn';
  maneuver: string;
}

// Extended OrderType with delivery coordinates
export interface OrderType {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  paymentMethod?: PaymentMethod;
  status?: OrderStatus;
  priority?: OrderPriority;
  specialInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
  estimatedDeliveryTime?: string;
  items?: OrderItem[];
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
}