// Professional Driver API Routes
import { Express } from 'express';

export function setupDriverAPI(app: Express, storage: any, orderAssignments: any, driverTimers: any, securityManager: any) {
  
  // Driver secure authentication
  app.post('/api/driver/secure-auth', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        });
      }

      console.log(`🔐 Driver login attempt: ${username}`);

      // Check in security system first
      try {
        const securityAuth = securityManager.authenticateUser(username, password, 'driver');
        if (securityAuth && securityAuth.success) {
          console.log('✅ Driver authenticated via security system');
          return res.json({
            success: true,
            user: securityAuth.user,
            token: securityAuth.token,
            sessionToken: securityAuth.sessionToken
          });
        }
      } catch (err) {
        console.log('⚠️ Security system check failed, using fallback');
      }

      // Fallback to driver storage
      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => 
        d.username === username || 
        d.email === username ||
        d.driverCode === username
      );

      if (!driver) {
        console.log(`❌ Driver not found: ${username}`);
        return res.status(401).json({
          success: false,
          error: 'اسم المستخدم غير موجود'
        });
      }

      // Simple password check (in production, use proper hashing)
      if (driver.password !== password) {
        console.log(`❌ Invalid password for driver: ${username}`);
        return res.status(401).json({
          success: false,
          error: 'كلمة المرور غير صحيحة'
        });
      }

      // Generate session token
      const sessionToken = `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const token = Buffer.from(`${driver.id}:${sessionToken}`).toString('base64');

      console.log(`✅ Driver ${driver.name} logged in successfully`);

      res.json({
        success: true,
        user: {
          id: driver.id,
          fullName: driver.name,
          email: driver.email,
          driverCode: driver.driverCode,
          role: 'driver'
        },
        token,
        sessionToken
      });

    } catch (error) {
      console.error('❌ Driver auth error:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في الخادم'
      });
    }
  });

  // Get live notifications for driver
  app.get('/api/driver/live-notifications', async (req, res) => {
    try {
      console.log('📱 Getting live driver notifications');
      
      const liveNotifications = [];
      
      // Check for pending order assignments
      for (const [orderId, assignment] of orderAssignments.entries()) {
        if (assignment.status === 'pending') {
          liveNotifications.push({
            id: `order-${orderId}`,
            type: 'new_order',
            title: '🚚 طلب توصيل جديد',
            description: `طلب رقم ${orderId} متاح للتوصيل`,
            orderId: orderId,
            distance: '2.5 كم',
            commission: '15 جنيه',
            createdAt: assignment.startTime,
            expiresAt: new Date(Date.now() + 30000), // 30 seconds
            priority: 'urgent'
          });
        }
      }
      
      console.log(`📱 Returning ${liveNotifications.length} live notifications`);
      res.json(liveNotifications);
      
    } catch (error) {
      console.error('❌ Error getting live notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  });

  // Get active orders for driver
  app.get('/api/driver/active-orders', async (req, res) => {
    try {
      console.log('📦 Getting active driver orders');
      
      const allOrders = await storage.getAllOrders();
      const activeOrders = allOrders.filter(order => 
        order.status === 'assigned_to_driver' || 
        order.status === 'picked_up' || 
        order.status === 'in_transit'
      );
      
      console.log(`📦 Returning ${activeOrders.length} active orders`);
      res.json(activeOrders);
      
    } catch (error) {
      console.error('❌ Error getting active orders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active orders'
      });
    }
  });

  // Get today's stats for driver
  app.get('/api/driver/today-stats', async (req, res) => {
    try {
      const stats = {
        totalOrders: 5,
        totalEarnings: 75,
        totalDistance: 12.5,
        averageRating: 4.8,
        hoursWorked: 4.2
      };
      
      res.json(stats);
      
    } catch (error) {
      console.error('❌ Error getting today stats:', error);
      res.status(500).json({});
    }
  });

  // Accept order (Professional version)
  app.post('/api/driver/accept-order', async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      console.log(`✅ Professional: Accepting order ${orderId}`);

      const assignment = orderAssignments.get(orderId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: 'Order assignment not found'
        });
      }

      if (assignment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Order already processed'
        });
      }

      const drivers = await storage.getAllDrivers();
      if (drivers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No drivers available'
        });
      }
      const driverId = drivers[0].id;

      // Update assignment
      assignment.status = 'accepted';
      assignment.acceptedBy = driverId;
      assignment.acceptedAt = new Date();

      // Clear timers
      for (const [key, timer] of driverTimers.entries()) {
        if (key.startsWith(`${orderId}-`)) {
          clearTimeout(timer);
          driverTimers.delete(key);
        }
      }

      await storage.updateOrderStatus(orderId, 'assigned_to_driver');

      console.log(`🎉 Order ${orderId} professionally assigned to driver ${driverId}`);

      res.json({
        success: true,
        message: 'Order accepted successfully',
        orderId,
        driverId
      });

    } catch (error) {
      console.error('❌ Error accepting order professionally:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept order'
      });
    }
  });

  // Reject order (Professional version)
  app.post('/api/driver/reject-order', async (req, res) => {
    try {
      const { orderId } = req.body;
      
      console.log(`❌ Professional: Rejecting order ${orderId}`);

      const assignment = orderAssignments.get(orderId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: 'Order assignment not found'
        });
      }

      // Move to next driver or end assignment
      assignment.currentDriverIndex++;
      
      if (assignment.currentDriverIndex >= assignment.drivers.length) {
        assignment.status = 'failed';
        console.log(`❌ No more drivers available for order ${orderId}`);
      } else {
        const nextDriverId = assignment.drivers[assignment.currentDriverIndex];
        console.log(`📱 Moving order ${orderId} to next driver: ${nextDriverId}`);
        
        // Start timer for next driver
        const timer = setTimeout(async () => {
          console.log(`⏰ Timer expired for driver ${nextDriverId} on order ${orderId}`);
          assignment.currentDriverIndex++;
          
          if (assignment.currentDriverIndex >= assignment.drivers.length) {
            assignment.status = 'failed';
            console.log(`❌ No more drivers available for order ${orderId}`);
          } else {
            const nextNextDriverId = assignment.drivers[assignment.currentDriverIndex];
            console.log(`📱 Moving order ${orderId} to next driver: ${nextNextDriverId}`);
            startDriverTimer(orderId, nextNextDriverId, assignment);
          }
        }, 60000); // 60 seconds

        // Store timer reference
        driverTimers.set(`${orderId}-${nextDriverId}`, timer);
      }

      res.json({
        success: true,
        message: 'Order rejected and moved to next driver'
      });

    } catch (error) {
      console.error('❌ Error rejecting order professionally:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject order'
      });
    }
  });

  // Update order status (Professional version)
  app.post('/api/driver/update-order-status', async (req, res) => {
    try {
      const { orderId, status } = req.body;
      
      console.log(`📋 Professional: Updating order ${orderId} to status: ${status}`);

      await storage.updateOrderStatus(orderId, status);

      // Send notification to customer based on status
      if (status === 'picked_up') {
        console.log(`📱 Order ${orderId} picked up - notifying customer`);
      } else if (status === 'delivered') {
        console.log(`📱 Order ${orderId} delivered - notifying customer`);
      }

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating order status professionally:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  });

  console.log('✅ Professional Driver API routes loaded');
}

// Helper function to start driver timer
function startDriverTimer(orderId: string, driverId: string, assignment: any) {
  const timer = setTimeout(async () => {
    console.log(`⏰ Timer expired for driver ${driverId} on order ${orderId}`);
    assignment.currentDriverIndex++;
    
    if (assignment.currentDriverIndex >= assignment.drivers.length) {
      assignment.status = 'failed';
      console.log(`❌ No more drivers available for order ${orderId}`);
    } else {
      const nextDriverId = assignment.drivers[assignment.currentDriverIndex];
      console.log(`📱 Moving order ${orderId} to next driver: ${nextDriverId}`);
      startDriverTimer(orderId, nextDriverId, assignment);
    }
  }, 60000);

  // Store timer reference
  global.driverTimers = global.driverTimers || new Map();
  global.driverTimers.set(`${orderId}-${driverId}`, timer);
}