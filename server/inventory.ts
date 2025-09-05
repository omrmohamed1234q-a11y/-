// Inventory Management Service
import type { 
  StockMovement, 
  StockAlert, 
  InventoryStats,
  InsertStockMovement,
  InsertStockAlert
} from '@shared/inventory';
import type { Product } from '@shared/schema';

// In-memory inventory storage (will be replaced with database)
class InventoryService {
  private stockMovements: Map<string, StockMovement[]> = new Map();
  private stockAlerts: StockAlert[] = [];
  private alertIdCounter = 1;
  private products: Map<string, any> = new Map();

  // Stock management methods
  async updateStock(
    productId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment' | 'damaged' | 'returned',
    reason: string,
    reference?: string,
    performedBy?: string,
    notes?: string
  ): Promise<StockMovement> {
    const movement: StockMovement = {
      id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      movementType,
      quantity: movementType === 'out' ? -Math.abs(quantity) : Math.abs(quantity),
      previousStock: 0, // Will be updated from product data
      newStock: 0, // Will be calculated
      reason,
      reference,
      notes,
      performedBy,
      createdAt: new Date()
    };

    // Store movement
    if (!this.stockMovements.has(productId)) {
      this.stockMovements.set(productId, []);
    }
    this.stockMovements.get(productId)!.push(movement);

    console.log(`📦 Stock updated: ${productId} ${movementType} ${quantity} (${reason})`);
    
    // Check for alerts after stock change
    await this.checkStockLevels(productId);

    return movement;
  }

  // Get stock movements for a product
  getProductMovements(productId: string): StockMovement[] {
    return this.stockMovements.get(productId) || [];
  }

  // Get all recent movements
  getRecentMovements(limit: number = 50): StockMovement[] {
    const allMovements: StockMovement[] = [];
    
    for (const movements of this.stockMovements.values()) {
      allMovements.push(...movements);
    }
    
    return allMovements
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Product management methods
  getAllProducts(): any[] {
    return Array.from(this.products.values());
  }

  addProduct(productData: any): any {
    const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const product = {
      id: productId,
      ...productData,
      status: productData.currentStock > productData.minStockLevel ? 'in_stock' : 
              productData.currentStock > 0 ? 'low_stock' : 'out_of_stock',
      createdAt: new Date()
    };
    
    this.products.set(productId, product);
    console.log(`✅ Product added: ${product.name} (${productId})`);
    return product;
  }

  updateProductStock(productId: string, newStock: number): any {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const oldStock = product.currentStock;
    product.currentStock = newStock;
    product.status = newStock > product.minStockLevel ? 'in_stock' : 
                    newStock > 0 ? 'low_stock' : 'out_of_stock';

    this.products.set(productId, product);
    
    // Record stock movement
    this.updateStock(
      productId,
      Math.abs(newStock - oldStock),
      newStock > oldStock ? 'in' : 'out',
      newStock > oldStock ? 'stock_adjustment' : 'manual_adjustment',
      undefined,
      'system',
      `Stock updated from ${oldStock} to ${newStock}`
    );

    console.log(`📦 Product stock updated: ${product.name} (${oldStock} → ${newStock})`);
    return product;
  }

  deleteProduct(productId: string): void {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    this.products.delete(productId);
    this.stockMovements.delete(productId);
    
    // Remove related alerts
    this.stockAlerts = this.stockAlerts.filter(alert => alert.productId !== productId);
    
    console.log(`❌ Product deleted: ${product.name} (${productId})`);
  }

  // Stock alert management
  async checkStockLevels(productId: string): Promise<void> {
    const product = this.products.get(productId);
    if (!product) return;
    // For now, we'll simulate the check
    console.log(`🔍 Checking stock levels for product: ${productId}`);
  }

  async createAlert(
    productId: string,
    alertType: 'low_stock' | 'out_of_stock' | 'reorder_needed',
    currentStock: number,
    threshold: number
  ): Promise<StockAlert> {
    const alert: StockAlert = {
      id: `alert-${this.alertIdCounter++}`,
      productId,
      alertType,
      alertLevel: alertType === 'out_of_stock' ? 'critical' : alertType === 'low_stock' ? 'warning' : 'info',
      currentStock,
      threshold,
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date()
    };

    this.stockAlerts.push(alert);
    console.log(`⚠️ Stock alert created: ${alertType} for product ${productId}`);
    
    return alert;
  }

  // Get active alerts
  getActiveAlerts(): StockAlert[] {
    return this.stockAlerts.filter(alert => !alert.isResolved);
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.stockAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      console.log(`✅ Stock alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  // Generate inventory statistics
  async generateStats(products: any[]): Promise<InventoryStats> {
    const inStockProducts = products.filter(p => (p.currentStock || 0) > 0);
    const lowStockProducts = products.filter(p => {
      const stock = p.currentStock || 0;
      const minLevel = p.minStockLevel || 5;
      return stock > 0 && stock <= minLevel;
    });
    const outOfStockProducts = products.filter(p => (p.currentStock || 0) === 0);
    
    const totalStockValue = products.reduce((sum, p) => {
      return sum + (p.currentStock || 0) * parseFloat(p.price.toString());
    }, 0);

    const topSellingProducts = products
      .filter(p => p.totalSold > 0)
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        totalSold: p.totalSold || 0,
        currentStock: p.currentStock || 0
      }));

    return {
      totalProducts: products.length,
      inStockProducts: inStockProducts.length,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalStockValue,
      averageStockLevel: products.length > 0 
        ? Math.round(products.reduce((sum, p) => sum + (p.currentStock || 0), 0) / products.length)
        : 0,
      topSellingProducts,
      recentMovements: this.getRecentMovements(20),
      activeAlerts: this.getActiveAlerts()
    };
  }

  // Simulate stock data for demonstration
  async createSampleData(): Promise<void> {
    const sampleProducts = [
      'print-service',
      'scan-service', 
      'book-math-grade-1',
      'book-science-grade-2'
    ];

    for (const productId of sampleProducts) {
      // Create some sample stock movements
      await this.updateStock(productId, 100, 'in', 'initial_stock', 'INV-001', 'admin', 'Initial inventory setup');
      await this.updateStock(productId, 15, 'out', 'sale', 'ORD-001', 'system', 'Customer purchase');
      await this.updateStock(productId, 5, 'out', 'sale', 'ORD-002', 'system', 'Customer purchase');
      
      // Create low stock alert for demonstration
      if (productId === 'print-service') {
        await this.createAlert(productId, 'low_stock', 8, 10);
      }
    }

    console.log('📊 Sample inventory data created');
  }
}

export const inventoryService = new InventoryService();