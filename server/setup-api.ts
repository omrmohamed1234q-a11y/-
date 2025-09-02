import type { Express } from "express";
import { supabaseSecurityStorage, checkSecurityTablesExist } from "./db-supabase";
import { supabaseSetup } from './supabase-auto-setup';
import { supabaseDirectSetup } from './supabase-direct-setup';
import { ManualSQLGenerator } from './manual-sql-generator';
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
      const hasTestAdmin = await supabaseSecurityStorage.getSecureAdminByCredentials('testadmin', 'admin@test.com');
      const hasTestDriver = await supabaseSecurityStorage.getSecureDriverByCredentials('testdriver', 'driver@test.com', 'DR001');
      
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
  
  // Auto-create tables via API (Direct Method)
  app.post('/api/auto-create-tables-direct', async (req, res) => {
    try {
      console.log('🔧 Starting direct table creation...');
      
      const result = await supabaseDirectSetup.createSecurityTables();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          details: result.details
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error in auto-create-tables-direct:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الجداول مباشرة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto-create tables via API (Original Method)
  app.post('/api/auto-create-tables', async (req, res) => {
    try {
      console.log('🔧 Starting automatic table creation...');
      
      const result = await supabaseSetup.createSecurityTables();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          details: result.details
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error in auto-create-tables:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الجداول تلقائياً',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check Supabase connection info
  app.get('/api/supabase-info', async (req, res) => {
    try {
      const info = await supabaseSetup.getSupabaseInfo();
      const tablesStatus = await supabaseSetup.checkTablesExist();
      
      res.json({
        success: true,
        connection: info,
        tables: tablesStatus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في فحص معلومات Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get SQL scripts for manual execution
  app.get('/api/get-setup-sql', async (req, res) => {
    try {
      const { type = 'full' } = req.query;
      
      let sql = '';
      let description = '';
      
      switch (type) {
        case 'full':
          sql = ManualSQLGenerator.getFullSetupSQL();
          description = 'كود SQL كامل لإنشاء الجداول والحسابات التجريبية';
          break;
        case 'tables':
          sql = ManualSQLGenerator.getTablesOnlySQL();
          description = 'كود SQL لإنشاء الجداول فقط';
          break;
        case 'accounts':
          sql = ManualSQLGenerator.getTestAccountsSQL();
          description = 'كود SQL لإنشاء الحسابات التجريبية فقط';
          break;
        default:
          sql = ManualSQLGenerator.getFullSetupSQL();
          description = 'كود SQL كامل';
      }
      
      res.json({
        success: true,
        type,
        description,
        sql,
        instructions: [
          'انسخ الكود SQL أدناه',
          'اذهب إلى Supabase Dashboard',
          'انتقل إلى SQL Editor',
          'الصق الكود واضغط Run',
          'تأكد من ظهور رسالة النجاح'
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إنتاج كود SQL',
        error: error instanceof Error ? error.message : 'Unknown error'
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
        const existingAdmin = await supabaseSecurityStorage.getSecureAdminByCredentials('testadmin', 'admin@test.com');
        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash('testpass123', 10);
          await supabaseSecurityStorage.createSecureAdmin({
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
        const existingDriver = await supabaseSecurityStorage.getSecureDriverByCredentials('testdriver', 'driver@test.com', 'DR001');
        if (!existingDriver) {
          const hashedPassword = await bcrypt.hash('driverpass123', 10);
          await supabaseSecurityStorage.createSecureDriver({
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