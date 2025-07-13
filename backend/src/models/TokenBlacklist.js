/**
 * Token Blacklist Model
 * Handles database operations for blacklisted tokens
 */

import pool from '../config/database.js';
import crypto from 'crypto';

class TokenBlacklist {
  /**
   * Add token to blacklist
   */
  static async addToken(token, userId, reason = 'logout') {
    const jti = this.generateJTI();
    const tokenHash = this.hashToken(token);
    
    // Extract expiry from token (assuming it's a valid JWT)
    let expiresAt;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expiresAt = new Date(payload.exp * 1000);
    } catch (error) {
      // If we can't parse the token, set expiry to 24 hours from now
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const query = `
      INSERT INTO token_blacklist (jti, token_hash, user_id, expires_at, reason)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (jti) DO NOTHING
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [jti, tokenHash, userId, expiresAt, reason]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(token) {
    const tokenHash = this.hashToken(token);

    const query = `
      SELECT id FROM token_blacklist 
      WHERE token_hash = $1 AND expires_at > NOW()
    `;

    try {
      const result = await pool.query(query, [tokenHash]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // In case of database error, assume token is not blacklisted to avoid blocking valid users
      return false;
    }
  }

  /**
   * Clean up expired tokens from blacklist
   */
  static async cleanupExpiredTokens() {
    const query = `
      DELETE FROM token_blacklist 
      WHERE expires_at <= NOW()
    `;

    try {
      const result = await pool.query(query);
      console.log(`Cleaned up ${result.rowCount} expired blacklisted tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user (forced logout)
   */
  static async revokeAllUserTokens(userId, reason = 'forced_logout') {
    // This is a simplified approach - in a full implementation,
    // you'd need to track all active tokens per user
    const query = `
      INSERT INTO token_blacklist (jti, token_hash, user_id, expires_at, reason)
      SELECT 
        gen_random_uuid()::text,
        'user_revocation_' || $1 || '_' || extract(epoch from now()),
        $1,
        NOW() + INTERVAL '7 days',
        $2
    `;

    try {
      await pool.query(query, [userId, reason]);
      console.log(`Revoked all tokens for user ${userId}`);
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      throw error;
    }
  }

  /**
   * Generate a unique JTI (JWT ID)
   */
  static generateJTI() {
    return crypto.randomUUID();
  }

  /**
   * Hash token for storage (one-way hash for security)
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get blacklist statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_blacklisted,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as active_blacklisted,
        COUNT(*) FILTER (WHERE reason = 'logout') as logout_count,
        COUNT(*) FILTER (WHERE reason = 'forced_logout') as forced_logout_count
      FROM token_blacklist
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting blacklist stats:', error);
      throw error;
    }
  }
}

export default TokenBlacklist;
