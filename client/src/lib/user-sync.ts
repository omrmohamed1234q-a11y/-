// User Account Sync Service
// Synchronizes Supabase users with backend account system

import { apiRequest } from './queryClient';
import type { User } from '@supabase/supabase-js';

export interface UserSyncResult {
  success: boolean;
  user?: any;
  error?: string;
}

// Sync authenticated user with backend
export async function syncUserAccount(supabaseUser: User): Promise<UserSyncResult> {
  try {
    console.log(`🔄 Syncing user account: ${supabaseUser.id}`);
    
    const userData = {
      email: supabaseUser.email,
      fullName: supabaseUser.user_metadata?.full_name || 
               supabaseUser.user_metadata?.name || 
               'مستخدم جديد',
      username: supabaseUser.email?.split('@')[0] || `user${supabaseUser.id.slice(0, 8)}`,
      role: supabaseUser.user_metadata?.role || 'customer'
    };

    const response = await apiRequest('POST', '/api/users/sync', userData);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ User account synced successfully');
      return {
        success: true,
        user: result.user
      };
    } else {
      console.error('❌ User sync failed:', result.error);
      return {
        success: false,
        error: result.error || 'Sync failed'
      };
    }
  } catch (error) {
    console.error('❌ User sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync error'
    };
  }
}

// Test user authentication and connection
export async function testUserConnection(): Promise<UserSyncResult> {
  try {
    console.log('🔍 Testing user connection...');
    
    const response = await apiRequest('GET', '/api/auth/user');
    const user = await response.json();
    
    console.log('✅ User connection successful:', user);
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('❌ User connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}