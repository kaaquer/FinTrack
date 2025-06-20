const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { runQuery, getRow, getAll } = require('../database/init');

const router = express.Router();

// Get all notifications for current user
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('isRead').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, isRead } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.business_id = ? AND n.user_id = ?';
    const params = [req.businessId, req.user.user_id];

    if (isRead !== undefined) {
      whereClause += ' AND n.is_read = ?';
      params.push(isRead === 'true' ? 1 : 0);
    }

    // Get notifications
    const notifications = await getAll(`
      SELECT 
        n.notification_id,
        n.notification_type,
        n.title,
        n.message,
        n.is_read,
        n.related_id,
        n.related_type,
        n.action_url,
        n.created_at
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await getRow(`
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `, params);

    // Get unread count
    const unreadCount = await getRow(`
      SELECT COUNT(*) as count
      FROM notifications n
      WHERE n.business_id = ? AND n.user_id = ? AND n.is_read = 0
    `, [req.businessId, req.user.user_id]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      },
      unreadCount: unreadCount.count
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    // Check if notification exists and belongs to user
    const notification = await getRow(
      'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ? AND business_id = ?',
      [req.params.id, req.user.user_id, req.businessId]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await runQuery(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
      [req.params.id]
    );

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await runQuery(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND business_id = ?',
      [req.user.user_id, req.businessId]
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    // Check if notification exists and belongs to user
    const notification = await getRow(
      'SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ? AND business_id = ?',
      [req.params.id, req.user.user_id, req.businessId]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await runQuery(
      'DELETE FROM notifications WHERE notification_id = ?',
      [req.params.id]
    );

    res.json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router; 