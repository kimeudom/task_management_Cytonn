/**
 * User Model
 * Handles all database operations related to users
 * Supports three user roles: admin, manager, user
 */

import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { normalizeRole, getRoleId, getRoleName } from '../constants/enums.js';

class User {
  constructor(userData) {
    this.id = userData.user_id || userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password_hash || userData.password;
    this.firstName = userData.first_name || userData.firstName;
    this.middleName = userData.middle_and_other_name || userData.middleName;
    this.lastName = userData.last_name || userData.lastName;

    // Standardize role handling
    this.roleId = userData.role_id || userData.roleId;
    this.role = normalizeRole(userData.role_name || userData.role || getRoleName(this.roleId));
    this.roleName = this.role; // For backward compatibility

    this.status = userData.status;
    this.isVerified = userData.is_verified || userData.isVerified || false;
    this.createdAt = userData.created_at || userData.createdAt;
    this.updatedAt = userData.updated_at || userData.updatedAt;
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, firstName, middleName, lastName, roleId = 2, isVerified = false } = userData;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, email, password_hash, first_name, middle_and_other_name, last_name, role_id, status, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING user_id, username, email, first_name, middle_and_other_name, last_name, role_id, status, is_verified, created_at, updated_at
    `;

    const values = [username, email, hashedPassword, firstName, middleName || '', lastName, roleId, 'active', isVerified];

    try {
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT u.user_id, u.username, u.email, u.password_hash, u.first_name, u.middle_and_other_name, u.last_name,
             u.role_id, r.role_name, u.status, u.is_verified, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1 AND u.status = 'active'
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = `
      SELECT u.user_id, u.username, u.email, u.password_hash, u.first_name, u.middle_and_other_name, u.last_name,
             u.role_id, r.role_name, u.status, u.is_verified, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = $1 AND u.status = 'active'
    `;

    try {
      const result = await pool.query(query, [email]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(page = 1, limit = 10, roleName = null) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT u.user_id, u.username, u.email, u.first_name, u.middle_and_other_name, u.last_name,
             u.role_id, r.role_name, u.status, u.is_verified, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.status = 'active'
    `;
    let values = [];
    let paramCount = 0;

    if (roleName) {
      paramCount++;
      query += ` AND r.role_name = $${paramCount}`;
      values.push(roleName);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      const users = result.rows.map(row => new User(row));

      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE u.status = 'active'
      `;
      let countValues = [];
      if (roleName) {
        countQuery += ' AND r.role_name = $1';
        countValues.push(roleName);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    const allowedFields = ['email', 'firstName', 'lastName', 'role', 'isActive'];
    const updates = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        const dbField = key === 'firstName' ? 'first_name' : 
                       key === 'lastName' ? 'last_name' : 
                       key === 'isActive' ? 'is_active' : key;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(id);
    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount} AND status = 'active'
      RETURNING user_id, username, email, first_name, middle_and_other_name, last_name, role_id, status, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user
  static async delete(id) {
    const query = `
      UPDATE users
      SET status = 'deleted', updated_at = NOW()
      WHERE user_id = $1 AND status = 'active'
      RETURNING user_id
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Update password
  async updatePassword(newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING user_id
    `;

    try {
      const result = await pool.query(query, [hashedPassword, this.id]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verify user email
  static async verifyEmail(userId) {
    const query = `
      UPDATE users
      SET is_verified = true, updated_at = NOW()
      WHERE user_id = $1 AND status = 'active'
      RETURNING user_id, username, email, first_name, middle_and_other_name, last_name, role_id, status, is_verified, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is verified
  static async isUserVerified(userId) {
    const query = `
      SELECT is_verified
      FROM users
      WHERE user_id = $1 AND status = 'active'
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0].is_verified : false;
    } catch (error) {
      throw error;
    }
  }

  // Find unverified users (for cleanup or admin purposes)
  static async findUnverified(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.user_id, u.username, u.email, u.first_name, u.middle_and_other_name, u.last_name,
             u.role_id, r.role_name, u.status, u.is_verified, u.created_at, u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.status = 'active' AND u.is_verified = false
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      const users = result.rows.map(row => new User(row));

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM users
        WHERE status = 'active' AND is_verified = false
      `;
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON (exclude password)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      middleName: this.middleName,
      lastName: this.lastName,
      role: this.role,
      roleId: this.roleId,
      roleName: this.roleName,
      status: this.status,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default User;
