// Inventory Management API Routes
import type { Express } from "express";
import { inventoryService } from "./inventory";
import { insertStockMovementSchema } from "@shared/inventory";

export function registerInventoryRoutes(app: Express) {
  
  // ==================== INVENTORY DASHBOARD ====================
  
  // Get inventory dashboard stats  
  app.get('/api/inventory/dashboard', async (req: any, res) => {
    try {
      // Mock products data for now (will be replaced with actual database query)
      const mockProducts = [
        {
          id: 'print-service',
          name: 'خدمة الطباعة',
          price: '0.50',
          currentStock: 80,
          minStockLevel: 10,
          reorderPoint: 20,
          totalSold: 150
        },
        {
          id: 'scan-service', 
          name: 'خدمة المسح الضوئي',
          price: '1.00',
          currentStock: 5,
          minStockLevel: 10,
          reorderPoint: 15,
          totalSold: 45
        },
        {
          id: 'book-math-grade-1',
          name: 'كتاب الرياضيات - الصف الأول',
          price: '25.00',
          currentStock: 0,
          minStockLevel: 5,
          reorderPoint: 10,
          totalSold: 30
        },
        {
          id: 'book-science-grade-2',
          name: 'كتاب العلوم - الصف الثاني', 
          price: '30.00',
          currentStock: 25,
          minStockLevel: 5,
          reorderPoint: 10,
          totalSold: 20
        }
      ] as any[];

      const stats = await inventoryService.generateStats(mockProducts);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching inventory dashboard:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch inventory dashboard' 
      });
    }
  });

  // ==================== STOCK MOVEMENTS ====================

  // Get stock movements for a product
  app.get('/api/inventory/movements/:productId', async (req: any, res) => {
    try {
      const { productId } = req.params;
      const movements = inventoryService.getProductMovements(productId);
      
      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch stock movements' 
      });
    }
  });

  // Get recent stock movements (all products)
  app.get('/api/inventory/movements', async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const movements = inventoryService.getRecentMovements(limit);
      
      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      console.error('Error fetching recent movements:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch recent movements' 
      });
    }
  });

  // Record stock movement
  app.post('/api/inventory/movements', async (req, res) => {
    try {
      const {
        productId,
        quantity,
        movementType,
        reason,
        reference,
        notes
      } = req.body;

      const performedBy = (req.user as any)?.id || 'system';

      const movement = await inventoryService.updateStock(
        productId,
        quantity,
        movementType,
        reason,
        reference,
        performedBy,
        notes
      );

      res.json({
        success: true,
        data: movement,
        message: 'Stock movement recorded successfully'
      });
    } catch (error) {
      console.error('Error recording stock movement:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to record stock movement' 
      });
    }
  });

  // ==================== STOCK ALERTS ====================

  // Get active stock alerts
  app.get('/api/inventory/alerts', async (req: any, res) => {
    try {
      const alerts = inventoryService.getActiveAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch stock alerts' 
      });
    }
  });

  // Resolve stock alert
  app.put('/api/inventory/alerts/:alertId/resolve', async (req, res) => {
    try {
      const { alertId } = req.params;
      const resolvedBy = (req.user as any)?.id || 'system';
      
      const success = await inventoryService.resolveAlert(alertId, resolvedBy);
      
      if (success) {
        res.json({
          success: true,
          message: 'Alert resolved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
    } catch (error) {
      console.error('Error resolving stock alert:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to resolve stock alert' 
      });
    }
  });

  // ==================== BULK OPERATIONS ====================

  // Bulk stock update
  app.post('/api/inventory/bulk-update', async (req, res) => {
    try {
      const { updates } = req.body; // Array of {productId, quantity, movementType, reason}
      const performedBy = (req.user as any)?.id || 'system';
      const results = [];

      for (const update of updates) {
        try {
          const movement = await inventoryService.updateStock(
            update.productId,
            update.quantity,
            update.movementType,
            update.reason,
            `BULK-${Date.now()}`,
            performedBy,
            update.notes
          );
          results.push({ success: true, productId: update.productId, movement });
        } catch (error) {
          results.push({ 
            success: false, 
            productId: update.productId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Processed ${results.length} bulk updates`
      });
    } catch (error) {
      console.error('Error processing bulk update:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process bulk update' 
      });
    }
  });

  // ==================== SAMPLE DATA (Development) ====================

  // Create sample inventory data
  app.post('/api/inventory/create-sample-data', async (req: any, res) => {
    try {
      await inventoryService.createSampleData();
      
      res.json({
        success: true,
        message: 'Sample inventory data created successfully'
      });
    } catch (error) {
      console.error('Error creating sample data:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create sample data' 
      });
    }
  });
}