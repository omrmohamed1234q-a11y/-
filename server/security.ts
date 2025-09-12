// Centralized security singleton to prevent multiple instances issue
import { MemorySecurityStorage } from './memory-security-storage';
import { randomBytes } from 'crypto';

// Create and export a single instance used across the entire application
export const securityStorage = new MemorySecurityStorage();

// Token management with expiry
interface AdminToken {
  token: string;
  userId: string;
  expiresAt: Date;
  issuedAt: Date;
}

// In-memory token storage with expiry (24 hours)
const adminTokens = new Map<string, AdminToken>();

// Issue a new admin token with 24-hour expiry
export const issueAdminToken = (userId: string): string => {
  // Clean up expired tokens first
  cleanupExpiredTokens();
  
  // Generate secure 32-byte hex token
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  const adminToken: AdminToken = {
    token,
    userId,
    expiresAt,
    issuedAt: now
  };
  
  // Store in tokens map
  adminTokens.set(token, adminToken);
  
  // Also update user's currentToken for backward compatibility
  securityStorage.updateSecurityUserToken(userId, token);
  
  console.log(`🔐 Issued admin token for user ${userId}: ${token.substring(0, 8)}...`);
  return token;
};

// Verify admin token and return user if valid
export const verifyAdminToken = async (token: string): Promise<any | null> => {
  if (!token) return null;
  
  console.log(`🔍 Verifying admin token: ${token.substring(0, 8)}...`);
  
  // Clean up expired tokens first
  cleanupExpiredTokens();
  
  // Check if token exists and is not expired
  const adminToken = adminTokens.get(token);
  if (!adminToken) {
    console.log(`❌ Token not found in active tokens map`);
    return null;
  }
  
  if (new Date() > adminToken.expiresAt) {
    console.log(`❌ Token expired at ${adminToken.expiresAt}`);
    adminTokens.delete(token);
    return null;
  }
  
  // Get user from storage
  const user = await securityStorage.getUserById(adminToken.userId);
  if (!user || user.role !== 'admin' || !user.is_active) {
    console.log(`❌ User not found, not admin, or inactive`);
    adminTokens.delete(token);
    return null;
  }
  
  console.log(`✅ Valid admin token for: ${user.username}`);
  return user;
};

// Clean up expired tokens (called before each operation)
const cleanupExpiredTokens = (): void => {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [token, adminToken] of adminTokens.entries()) {
    if (now > adminToken.expiresAt) {
      adminTokens.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired admin tokens`);
  }
};

// Get active tokens count (for monitoring)
export const getActiveTokensCount = (): number => {
  cleanupExpiredTokens();
  return adminTokens.size;
};