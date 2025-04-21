import { prisma } from '@/lib/prisma/client';

/**
 * Create a notification for a provider about a new transaction
 * @param {string} providerId - The ID of the provider to notify
 * @param {string} transactionId - The ID of the transaction
 * @param {string} serviceName - The name of the service
 * @returns {Promise<Object>} - The created notification
 */
export async function createProviderNotification(providerId, transactionId, serviceName) {
  try {
    // Create notification in the database
    const notification = await prisma.notification.create({
      data: {
        userId: providerId,
        type: 'SYSTEM',
        title: 'New Transaction Request',
        content: `You have a new booking request for "${serviceName}". Transaction ID: ${transactionId}`,
        isRead: false,
      }
    });

    console.log(`Created notification for provider ${providerId} about transaction ${transactionId}`);
    return notification;
  } catch (error) {
    console.error('Error creating provider notification:', error);
    // Don't throw the error to avoid breaking the transaction flow
    return null;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The ID of the notification
 * @returns {Promise<Object>} - The updated notification
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications for a user as read
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - The result of the update operation
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
    
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
} 