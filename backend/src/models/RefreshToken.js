/**
 * Refresh Token Model
 * Handles database operations for persistent refresh tokens
 */

import pool from '../config/database.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class RefreshToken {
  constructor(tokenData) {
    this.id = tokenData.id;
    this.jti = tokenData.jti;
    this.tokenHash = tokenData.token_hash;
    this.userId = tokenData.user_id;
    this.deviceInfo = tokenData.device_info;
    this.expiresAt = tokenData.expires_at;
    this.createdAt = tokenData.created_at;
    this.lastUsedAt = tokenData.last_used_at;
    this.isRevoked = tokenData.is_revoked;
  }

  /**
   * Create and store a new refresh token
   */
  static async create(userId, deviceInfo = null) {
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const query = `
      INSERT INTO refresh_tokens (jti, user_id, device_info, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, jti, user_id, device_info, expires_at, created_at, last_used_at, is_revoked
    `;

    try {
      const result = await pool.query(query, [jti, userId, deviceInfo, expiresAt]);
      const refreshTokenRecord = new RefreshToken(result.rows[0]);

      // Return the JTI for JWT creation
      return {
        jti,
        record: refreshTokenRecord
      };
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify and retrieve refresh token by JTI
   */
  static async verify(jti) {
    const query = `
      SELECT id, jti, user_id, device_info, expires_at, created_at, last_used_at, is_revoked
      FROM refresh_tokens
      WHERE jti = $1 AND expires_at > NOW() AND is_revoked = FALSE
    `;

    try {
      const result = await pool.query(query, [jti]);

      if (result.rows.length === 0) {
        return null;
      }

      return new RefreshToken(result.rows[0]);
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed() {
    const query = `
      UPDATE refresh_tokens 
      SET last_used_at = NOW() 
      WHERE id = $1
    `;

    try {
      await pool.query(query, [this.id]);
      this.lastUsedAt = new Date();
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }

  /**
   * Revoke a specific refresh token
   */
  static async revoke(jti) {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = TRUE 
      WHERE jti = $1
    `;

    try {
      const result = await pool.query(query, [jti]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllForUser(userId) {
    const query = `
      UPDATE refresh_tokens 
      SET is_revoked = TRUE 
      WHERE user_id = $1 AND is_revoked = FALSE
    `;

    try {
      const result = await pool.query(query, [userId]);
      console.log(`Revoked ${result.rowCount} refresh tokens for user ${userId}`);
      return result.rowCount;
    } catch (error) {
      console.error('Error revoking user refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpired() {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at <= NOW() OR is_revoked = TRUE
    `;

    try {
      const result = await pool.query(query);
      console.log(`Cleaned up ${result.rowCount} expired/revoked refresh tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Get active tokens for a user
   */
  static async getActiveTokensForUser(userId) {
    const query = `
      SELECT id, jti, device_info, expires_at, created_at, last_used_at
      FROM refresh_tokens 
      WHERE user_id = $1 AND expires_at > NOW() AND is_revoked = FALSE
      ORDER BY last_used_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => new RefreshToken(row));
    } catch (error) {
      console.error('Error getting active tokens:', error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for secure storage
   */
  static async hashToken(token) {
    const saltRounds = 12;
    return await bcrypt.hash(token, saltRounds);
  }

  /**
   * Get refresh token statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE expires_at > NOW() AND is_revoked = FALSE) as active_tokens,
        COUNT(*) FILTER (WHERE is_revoked = TRUE) as revoked_tokens,
        COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_tokens,
        COUNT(DISTINCT user_id) as unique_users
      FROM refresh_tokens
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting refresh token stats:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      jti: this.jti,
      userId: this.userId,
      deviceInfo: this.deviceInfo,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      isRevoked: this.isRevoked
    };
  }
}

export default RefreshToken;
