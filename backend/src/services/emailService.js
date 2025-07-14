/**
 * Email Service
 * Handles all email operations using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';
import crypto from 'crypto';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter with Gmail SMTP configuration
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Verify the connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
        } else {
          console.log('Email service is ready to send emails');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: {
          name: 'Task Management System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(userName, verificationUrl),
        text: this.getVerificationEmailText(userName, verificationUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task assignment notification email
   */
  async sendTaskAssignmentEmail(userEmail, userName, taskTitle, taskDescription, assignedBy) {
    try {
      const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks`;
      
      const mailOptions = {
        from: {
          name: 'Task Management System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `New Task Assigned: ${taskTitle}`,
        html: this.getTaskAssignmentEmailTemplate(userName, taskTitle, taskDescription, assignedBy, taskUrl),
        text: this.getTaskAssignmentEmailText(userName, taskTitle, taskDescription, assignedBy, taskUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Task assignment email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send task assignment email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task status change notification email
   */
  async sendTaskStatusChangeEmail(userEmail, userName, taskTitle, oldStatus, newStatus, changedBy) {
    try {
      const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks`;
      
      const mailOptions = {
        from: {
          name: 'Task Management System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `Task Status Updated: ${taskTitle}`,
        html: this.getTaskStatusChangeEmailTemplate(userName, taskTitle, oldStatus, newStatus, changedBy, taskUrl),
        text: this.getTaskStatusChangeEmailText(userName, taskTitle, oldStatus, newStatus, changedBy, taskUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Task status change email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send task status change email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task removal notification email
   */
  async sendTaskRemovalEmail(userEmail, userName, taskTitle, removedBy) {
    try {
      const mailOptions = {
        from: {
          name: 'Task Management System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `Task Assignment Removed: ${taskTitle}`,
        html: this.getTaskRemovalEmailTemplate(userName, taskTitle, removedBy),
        text: this.getTaskRemovalEmailText(userName, taskTitle, removedBy)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Task removal email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send task removal email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task update notification email
   */
  async sendTaskUpdateEmail(userEmail, userName, taskTitle, updateDetails, updatedBy) {
    try {
      const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks`;
      
      const mailOptions = {
        from: {
          name: 'Task Management System',
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `Task Updated: ${taskTitle}`,
        html: this.getTaskUpdateEmailTemplate(userName, taskTitle, updateDetails, updatedBy, taskUrl),
        text: this.getTaskUpdateEmailText(userName, taskTitle, updateDetails, updatedBy, taskUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Task update email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send task update email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Email verification HTML template
   */
  getVerificationEmailTemplate(userName, verificationUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Task Management System!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with our Task Management System. To complete your registration and access all features, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>Important:</strong> You must verify your email address before you can access any system features.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Task Management System. Please do not reply to this email.</p>
      </div>
    `;
  }

  /**
   * Email verification plain text template
   */
  getVerificationEmailText(userName, verificationUrl) {
    return `
Welcome to Task Management System!

Hello ${userName},

Thank you for registering with our task management system. To complete your registration and access all features, please verify your email address by visiting this link:

${verificationUrl}

Important: You must verify your email address before you can access any system features.

If you didn't create an account with us, please ignore this email.

---
This is an automated message. Please do not reply to this email.
    `;
  }

  /**
   * Task assignment HTML template
   */
  getTaskAssignmentEmailTemplate(userName, taskTitle, taskDescription, assignedBy, taskUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Assigned</h2>
        <p>Hello ${userName},</p>
        <p>You have been assigned a new task by ${assignedBy}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">${taskTitle}</h3>
          <p style="margin-bottom: 0;">${taskDescription || 'No description provided.'}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task</a>
        </div>
        <p>Please log in to the system to view more details and update the task status.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Task Management System. Please do not reply to this email.</p>
      </div>
    `;
  }

  /**
   * Task assignment plain text template
   */
  getTaskAssignmentEmailText(userName, taskTitle, taskDescription, assignedBy, taskUrl) {
    return `
New Task Assigned

Hello ${userName},

You have been assigned a new task by ${assignedBy}:

Task: ${taskTitle}
Description: ${taskDescription || 'No description provided.'}

Please log in to the system to view more details and update the task status:
${taskUrl}

---
This is an automated message from Task Management System. Please do not reply to this email.
    `;
  }

  /**
   * Task status change HTML template
   */
  getTaskStatusChangeEmailTemplate(userName, taskTitle, oldStatus, newStatus, changedBy, taskUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Task Status Updated</h2>
        <p>Hello ${userName},</p>
        <p>The status of your assigned task has been updated by ${changedBy}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">${taskTitle}</h3>
          <p><strong>Previous Status:</strong> <span style="color: #6c757d;">${oldStatus}</span></p>
          <p><strong>New Status:</strong> <span style="color: #28a745;">${newStatus}</span></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task</a>
        </div>
        <p>Please log in to the system to view more details.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Task Management System. Please do not reply to this email.</p>
      </div>
    `;
  }

  /**
   * Task status change plain text template
   */
  getTaskStatusChangeEmailText(userName, taskTitle, oldStatus, newStatus, changedBy, taskUrl) {
    return `
Task Status Updated

Hello ${userName},

The status of your assigned task has been updated by ${changedBy}:

Task: ${taskTitle}
Previous Status: ${oldStatus}
New Status: ${newStatus}

Please log in to the system to view more details:
${taskUrl}

---
This is an automated message from Task Management System. Please do not reply to this email.
    `;
  }

  /**
   * Task removal HTML template
   */
  getTaskRemovalEmailTemplate(userName, taskTitle, removedBy) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Task Assignment Removed</h2>
        <p>Hello ${userName},</p>
        <p>You have been removed from the following task by ${removedBy}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc3545;">${taskTitle}</h3>
          <p style="margin-bottom: 0;">You are no longer assigned to this task.</p>
        </div>
        <p>If you have any questions about this change, please contact your manager or administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Task Management System. Please do not reply to this email.</p>
      </div>
    `;
  }

  /**
   * Task removal plain text template
   */
  getTaskRemovalEmailText(userName, taskTitle, removedBy) {
    return `
Task Assignment Removed

Hello ${userName},

You have been removed from the following task by ${removedBy}:

Task: ${taskTitle}

You are no longer assigned to this task.

If you have any questions about this change, please contact your manager or administrator.

---
This is an automated message from Task Management System. Please do not reply to this email.
    `;
  }

  /**
   * Task update HTML template
   */
  getTaskUpdateEmailTemplate(userName, taskTitle, updateDetails, updatedBy, taskUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Task Updated</h2>
        <p>Hello ${userName},</p>
        <p>One of your assigned tasks has been updated by ${updatedBy}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">${taskTitle}</h3>
          <p><strong>Changes made:</strong></p>
          <ul>
            ${updateDetails.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${taskUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Task</a>
        </div>
        <p>Please log in to the system to view the updated task details.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Task Management System. Please do not reply to this email.</p>
      </div>
    `;
  }

  /**
   * Task update plain text template
   */
  getTaskUpdateEmailText(userName, taskTitle, updateDetails, updatedBy, taskUrl) {
    return `
Task Updated

Hello ${userName},

One of your assigned tasks has been updated by ${updatedBy}:

Task: ${taskTitle}

Changes made:
${updateDetails.map(detail => `- ${detail}`).join('\n')}

Please log in to the system to view the updated task details:
${taskUrl}

---
This is an automated message from Task Management System. Please do not reply to this email.
    `;
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;
