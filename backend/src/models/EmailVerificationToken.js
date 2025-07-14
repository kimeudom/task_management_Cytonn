/**
 * Email Verification Token Model
 * Handles database operations for email verification tokens
 */

import pool from '../config/database.js';

class EmailVerificationToken {
  constructor(tokenData) {
    this.id = tokenData.id;
    this.userId = tokenData.user_id || tokenData.userId;
    this.token = tokenData.token;
    this.expiresAt = tokenData.expires_at || tokenData.expiresAt;
    this.createdAt = tokenData.created_at || tokenData.createdAt;
    this.usedAt = tokenData.used_at || tokenData.usedAt;
  }

  /**
   * Create a new email verification token
   */
  static async create(userId, token, expiresInHours = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const query = `
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token, expires_at, created_at, used_at
    `;

    try {
      const result = await pool.query(query, [userId, token, expiresAt]);
      return new EmailVerificationToken(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find token by token string
   */
  static async findByToken(token) {
    const query = `
      SELECT id, user_id, token, expires_at, created_at, used_at
      FROM email_verification_tokens
      WHERE token = $1 AND used_at IS NULL
    `;

    try {
      const result = await pool.query(query, [token]);
      return result.rows.length > 0 ? new EmailVerificationToken(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find tokens by user ID
   */
  static async findByUserId(userId) {
    const query = `
      SELECT id, user_id, token, expires_at, created_at, used_at
      FROM email_verification_tokens
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.map(row => new EmailVerificationToken(row));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark token as used
   */
  static async markAsUsed(token) {
    const query = `
      UPDATE email_verification_tokens
      SET used_at = NOW()
      WHERE token = $1 AND used_at IS NULL
      RETURNING id, user_id, token, expires_at, created_at, used_at
    `;

    try {
      const result = await pool.query(query, [token]);
      return result.rows.length > 0 ? new EmailVerificationToken(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete expired tokens (cleanup)
   */
  static async deleteExpired() {
    const query = `
      DELETE FROM email_verification_tokens
      WHERE expires_at < NOW()
      RETURNING COUNT(*) as deleted_count
    `;

    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].deleted_count || 0);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete all tokens for a user (useful when user is verified)
   */
  static async deleteByUserId(userId) {
    const query = `
      DELETE FROM email_verification_tokens
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rowCount || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if token is valid (not expired and not used)
   */
  isValid() {
    const now = new Date();
    const expiresAt = new Date(this.expiresAt);
    return !this.usedAt && expiresAt > now;
  }

  /**
   * Check if token is expired
   */
  isExpired() {
    const now = new Date();
    const expiresAt = new Date(this.expiresAt);
    return expiresAt <= now;
  }

  /**
   * Check if token has been used
   */
  isUsed() {
    return !!this.usedAt;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      token: this.token,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: this.usedAt,
      isValid: this.isValid(),
      isExpired: this.isExpired(),
      isUsed: this.isUsed()
    };
  }
}

export default EmailVerificationToken;
