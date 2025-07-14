/**
 * Task Notification Service
 * Handles email notifications for task-related events
 */

import emailService from './emailService.js';
import User from '../models/User.js';

class TaskNotificationService {
  /**
   * Send notifications when users are assigned to a task
   */
  async notifyTaskAssignment(task, assignedUserIds, assignedByUser) {
    try {
      const notifications = [];

      for (const userId of assignedUserIds) {
        const user = await User.findById(userId);
        if (user && user.isVerified) {
          const notification = emailService.sendTaskAssignmentEmail(
            user.email,
            user.firstName,
            task.title,
            task.description,
            `${assignedByUser.firstName} ${assignedByUser.lastName}`
          );
          notifications.push(notification);
        }
      }

      const results = await Promise.allSettled(notifications);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
      const failed = results.length - successful;

      console.log(`Task assignment notifications: ${successful} sent, ${failed} failed`);
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending task assignment notifications:', error);
      return { successful: 0, failed: 0, total: 0, error: error.message };
    }
  }

  /**
   * Send notifications when task status changes
   */
  async notifyTaskStatusChange(task, oldStatus, newStatus, changedByUser) {
    try {
      if (!task.assignedUsers || task.assignedUsers.length === 0) {
        return { successful: 0, failed: 0, total: 0 };
      }

      const notifications = [];

      for (const assignedUser of task.assignedUsers) {
        // Don't notify the user who made the change
        if (assignedUser.id !== changedByUser.id) {
          const user = await User.findById(assignedUser.id);
          if (user && user.isVerified) {
            const notification = emailService.sendTaskStatusChangeEmail(
              user.email,
              user.firstName,
              task.title,
              oldStatus,
              newStatus,
              `${changedByUser.firstName} ${changedByUser.lastName}`
            );
            notifications.push(notification);
          }
        }
      }

      const results = await Promise.allSettled(notifications);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
      const failed = results.length - successful;

      console.log(`Task status change notifications: ${successful} sent, ${failed} failed`);
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending task status change notifications:', error);
      return { successful: 0, failed: 0, total: 0, error: error.message };
    }
  }

  /**
   * Send notifications when users are removed from a task
   */
  async notifyTaskRemoval(task, removedUserIds, removedByUser) {
    try {
      const notifications = [];

      for (const userId of removedUserIds) {
        const user = await User.findById(userId);
        if (user && user.isVerified) {
          const notification = emailService.sendTaskRemovalEmail(
            user.email,
            user.firstName,
            task.title,
            `${removedByUser.firstName} ${removedByUser.lastName}`
          );
          notifications.push(notification);
        }
      }

      const results = await Promise.allSettled(notifications);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
      const failed = results.length - successful;

      console.log(`Task removal notifications: ${successful} sent, ${failed} failed`);
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending task removal notifications:', error);
      return { successful: 0, failed: 0, total: 0, error: error.message };
    }
  }

  /**
   * Send notifications when task details are updated
   */
  async notifyTaskUpdate(task, updateDetails, updatedByUser) {
    try {
      if (!task.assignedUsers || task.assignedUsers.length === 0) {
        return { successful: 0, failed: 0, total: 0 };
      }

      const notifications = [];

      for (const assignedUser of task.assignedUsers) {
        // Don't notify the user who made the change
        if (assignedUser.id !== updatedByUser.id) {
          const user = await User.findById(assignedUser.id);
          if (user && user.isVerified) {
            const notification = emailService.sendTaskUpdateEmail(
              user.email,
              user.firstName,
              task.title,
              updateDetails,
              `${updatedByUser.firstName} ${updatedByUser.lastName}`
            );
            notifications.push(notification);
          }
        }
      }

      const results = await Promise.allSettled(notifications);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
      const failed = results.length - successful;

      console.log(`Task update notifications: ${successful} sent, ${failed} failed`);
      return { successful, failed, total: results.length };
    } catch (error) {
      console.error('Error sending task update notifications:', error);
      return { successful: 0, failed: 0, total: 0, error: error.message };
    }
  }

  /**
   * Generate update details array from changed fields
   */
  generateUpdateDetails(oldTask, newTask) {
    const details = [];

    if (oldTask.title !== newTask.title) {
      details.push(`Title changed from "${oldTask.title}" to "${newTask.title}"`);
    }

    if (oldTask.description !== newTask.description) {
      details.push(`Description updated`);
    }

    if (oldTask.priority !== newTask.priority) {
      details.push(`Priority changed from ${oldTask.priority} to ${newTask.priority}`);
    }

    if (oldTask.deadline !== newTask.deadline) {
      const oldDeadline = oldTask.deadline ? new Date(oldTask.deadline).toLocaleDateString() : 'None';
      const newDeadline = newTask.deadline ? new Date(newTask.deadline).toLocaleDateString() : 'None';
      details.push(`Deadline changed from ${oldDeadline} to ${newDeadline}`);
    }

    return details;
  }

  /**
   * Compare assigned users and determine additions/removals
   */
  compareAssignedUsers(oldAssignedUsers = [], newAssignedUsers = []) {
    const oldUserIds = oldAssignedUsers.map(user => user.id || user);
    const newUserIds = newAssignedUsers.map(user => user.id || user);

    const addedUsers = newUserIds.filter(id => !oldUserIds.includes(id));
    const removedUsers = oldUserIds.filter(id => !newUserIds.includes(id));

    return { addedUsers, removedUsers };
  }

  /**
   * Send all relevant notifications for a task update
   */
  async notifyTaskUpdateComplete(oldTask, newTask, updatedByUser) {
    try {
      const results = {
        assignment: { successful: 0, failed: 0, total: 0 },
        removal: { successful: 0, failed: 0, total: 0 },
        update: { successful: 0, failed: 0, total: 0 }
      };

      // Check for assignment changes
      const { addedUsers, removedUsers } = this.compareAssignedUsers(
        oldTask.assignedUsers,
        newTask.assignedUsers
      );

      // Send assignment notifications
      if (addedUsers.length > 0) {
        results.assignment = await this.notifyTaskAssignment(newTask, addedUsers, updatedByUser);
      }

      // Send removal notifications
      if (removedUsers.length > 0) {
        results.removal = await this.notifyTaskRemoval(oldTask, removedUsers, updatedByUser);
      }

      // Send update notifications for other changes
      const updateDetails = this.generateUpdateDetails(oldTask, newTask);
      if (updateDetails.length > 0) {
        results.update = await this.notifyTaskUpdate(newTask, updateDetails, updatedByUser);
      }

      return results;
    } catch (error) {
      console.error('Error in notifyTaskUpdateComplete:', error);
      return {
        assignment: { successful: 0, failed: 0, total: 0 },
        removal: { successful: 0, failed: 0, total: 0 },
        update: { successful: 0, failed: 0, total: 0 },
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
const taskNotificationService = new TaskNotificationService();
export default taskNotificationService;
