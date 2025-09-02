import type { Express } from "express";
import { supabaseSecurityStorage, checkSecurityTablesExist } from "./db-supabase";
import bcrypt from 'bcrypt';

export function addSetupEndpoints(app: Express) {
  // Test if security tables exist
  app.get('/api/test-security-tables', async (req, res) => {
    try {
      const tablesExist = await checkSecurityTablesExist();
      
      if (!tablesExist) {
        return res.json({
          success: false,
          message: 'Security tables do not exist',
          hasTestAccounts: false
        });
      }
      
      // Check if test accounts exist
      const hasTestAdmin = await supabaseSecurityStorage.getAdminByUsername('testadmin');
      const hasTestDriver = await supabaseSecurityStorage.getDriverByUsername('testdriver');
      
      res.json({
        success: true,
        message: 'Security tables exist and working',
        hasTestAccounts: !!(hasTestAdmin && hasTestDriver)
      });
    } catch (error) {
      console.error('Error testing security tables:', error);
      res.json({
        success: false,
        message: 'Error testing security tables',
        error: error instanceof Error ? error.message : 'Unknown error',
        hasTestAccounts: false
      });
    }
  });
  
  // Create test accounts
  app.post('/api/create-test-accounts', async (req, res) => {
    try {
      const tablesExist = await checkSecurityTablesExist();
      
      if (!tablesExist) {
        return res.status(400).json({
          success: false,
          error: 'Security tables do not exist. Please create them first.'
        });
      }
      
      // Create test admin
      try {
        const existingAdmin = await supabaseSecurityStorage.getAdminByUsername('testadmin');
        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash('testpass123', 10);
          await supabaseSecurityStorage.createAdmin({
            username: 'testadmin',
            email: 'admin@test.com',
            password: hashedPassword,
            fullName: 'مدير تجريبي',
            role: 'admin',
            permissions: ['read', 'write', 'admin'],
            isActive: true
          });
          console.log('✅ Test admin account created');
        }
      } catch (adminError) {
        console.warn('Admin account creation failed:', adminError);
      }
      
      // Create test driver
      try {
        const existingDriver = await supabaseSecurityStorage.getDriverByUsername('testdriver');
        if (!existingDriver) {
          const hashedPassword = await bcrypt.hash('driverpass123', 10);
          await supabaseSecurityStorage.createDriver({
            username: 'testdriver',
            email: 'driver@test.com',
            password: hashedPassword,
            driverCode: 'DR001',
            fullName: 'سائق تجريبي',
            phone: '1234567890',
            licenseNumber: 'LIC123',
            vehicleType: 'motorcycle',
            vehiclePlate: 'ABC123',
            isActive: true,
            status: 'offline'
          });
          console.log('✅ Test driver account created');
        }
      } catch (driverError) {
        console.warn('Driver account creation failed:', driverError);
      }
      
      res.json({
        success: true,
        message: 'Test accounts created successfully',
        accounts: {
          admin: 'testadmin / admin@test.com / testpass123',
          driver: 'testdriver / driver@test.com / driverpass123'
        }
      });
    } catch (error) {
      console.error('Error creating test accounts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}