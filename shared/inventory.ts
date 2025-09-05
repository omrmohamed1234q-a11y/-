// Inventory Management System Schemas
import { pgTable, varchar, text, integer, decimal, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { products } from './schema';

// Stock movements tracking
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  movementType: text("movement_type").notNull(), // "in", "out", "adjustment", "damaged", "returned"
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason"), // "purchase", "sale", "damage", "return", "adjustment", "initial_stock"
  reference: text("reference"), // Order ID, Purchase Order, etc.
  notes: text("notes"),
  performedBy: varchar("performed_by"), // User ID who made the change
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock alerts and notifications
export const stockAlerts = pgTable("stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // "low_stock", "out_of_stock", "reorder_needed"
  alertLevel: text("alert_level").default("warning"), // "info", "warning", "critical"
  currentStock: integer("current_stock").notNull(),
  threshold: integer("threshold").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase orders for restocking
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  supplierId: varchar("supplier_id"), // Future supplier management
  supplierName: varchar("supplier_name").notNull(),
  supplierContact: text("supplier_contact"),
  status: text("status").default("pending"), // "pending", "ordered", "received", "cancelled"
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0.00"),
  expectedDelivery: timestamp("expected_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  receivedBy: varchar("received_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase order items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory reports snapshots
export const inventorySnapshots = pgTable("inventory_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotDate: timestamp("snapshot_date").defaultNow(),
  reportType: text("report_type").notNull(), // "daily", "weekly", "monthly", "manual"
  totalProducts: integer("total_products").notNull(),
  totalStockValue: decimal("total_stock_value", { precision: 12, scale: 2 }).notNull(),
  lowStockItems: integer("low_stock_items").notNull(),
  outOfStockItems: integer("out_of_stock_items").notNull(),
  data: jsonb("data").notNull(), // Detailed snapshot data
  generatedBy: varchar("generated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types and schemas for inventory management
export type StockMovement = typeof stockMovements.$inferSelect;
export type StockAlert = typeof stockAlerts.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InventorySnapshot = typeof inventorySnapshots.$inferSelect;

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySnapshotSchema = createInsertSchema(inventorySnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertInventorySnapshot = z.infer<typeof insertInventorySnapshotSchema>;

// Inventory statistics interface
export interface InventoryStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  averageStockLevel: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    currentStock: number;
  }>;
  recentMovements: StockMovement[];
  activeAlerts: StockAlert[];
}

// Stock level calculation helper
export function calculateStockStatus(currentStock: number, minLevel: number, reorderPoint: number): string {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minLevel) return "low_stock";
  if (currentStock <= reorderPoint) return "reorder_needed";
  return "in_stock";
}