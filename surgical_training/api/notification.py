import frappe
from frappe import _
from frappe.utils import now, get_datetime
import json


@frappe.whitelist()
def get_user_notifications(limit=20, offset=0, only_unread=False):
	"""Get notifications for current user"""
	user = frappe.session.user
	
	print(f"🔔 DEBUG: get_user_notifications called for {user}")
	
	try:
		filters = {"user": user}
		if only_unread:
			filters["is_read"] = 0
		
		notifications = frappe.get_list(
			"User Notification",
			filters=filters,
			fields=[
				"name", "title", "message", "notification_type", "is_read", 
				"created_at", "read_at", "action_url", "icon", "priority",
				"related_doctype", "related_doc"
			],
			order_by="created_at desc",
			limit=limit,
			start=offset
		)
		
		# Format timestamps for frontend
		for notification in notifications:
			if notification.created_at:
				notification.created_at = str(notification.created_at)
			if notification.read_at:
				notification.read_at = str(notification.read_at)
		
		# Get unread count
		unread_count = frappe.db.count("User Notification", {
			"user": user,
			"is_read": 0
		})
		
		return {
			"notifications": notifications,
			"unread_count": unread_count,
			"total_count": frappe.db.count("User Notification", {"user": user})
		}
		
	except Exception as e:
		frappe.log_error(f"Error getting notifications: {str(e)}")
		frappe.throw(_("Failed to get notifications"))


@frappe.whitelist()
def mark_notification_read(notification_id):
	"""Mark a notification as read"""
	user = frappe.session.user
	
	print(f"📖 DEBUG: mark_notification_read called for {notification_id} by {user}")
	
	try:
		# Security check - user can only mark their own notifications as read
		notification = frappe.get_doc("User Notification", notification_id)
		if notification.user != user:
			frappe.throw(_("Not permitted to access this notification"))
		
		if not notification.is_read:
			notification.mark_as_read()
		
		return {
			"status": "success",
			"message": "Notification marked as read"
		}
		
	except frappe.DoesNotExistError:
		frappe.throw(_("Notification not found"))
	except Exception as e:
		frappe.log_error(f"Error marking notification as read: {str(e)}")
		frappe.throw(_("Failed to mark notification as read"))


@frappe.whitelist()
def mark_all_notifications_read():
	"""Mark all notifications as read for current user"""
	user = frappe.session.user
	
	print(f"📖 DEBUG: mark_all_notifications_read called for {user}")
	
	try:
		# Get all unread notifications for this user
		unread_notifications = frappe.get_list(
			"User Notification",
			filters={"user": user, "is_read": 0},
			fields=["name"]
		)
		
		# Mark each as read
		for notification in unread_notifications:
			doc = frappe.get_doc("User Notification", notification.name)
			doc.mark_as_read()
		
		return {
			"status": "success",
			"message": f"Marked {len(unread_notifications)} notifications as read"
		}
		
	except Exception as e:
		frappe.log_error(f"Error marking all notifications as read: {str(e)}")
		frappe.throw(_("Failed to mark all notifications as read"))


@frappe.whitelist()
def create_notification(user, title, message, notification_type="info", 
						related_doctype=None, related_doc=None, action_url=None, 
						icon=None, priority="medium"):
	"""Create a new notification for a user"""
	current_user = frappe.session.user
	
	print(f"🔔 DEBUG: create_notification called by {current_user} for {user}")
	
	# Security check - only allow system/admin users to create notifications for others
	if user != current_user and not frappe.has_permission("User Notification", "create"):
		frappe.throw(_("Not permitted to create notifications for other users"))
	
	try:
		notification = frappe.get_doc({
			"doctype": "User Notification",
			"user": user,
			"title": title,
			"message": message,
			"notification_type": notification_type,
			"related_doctype": related_doctype,
			"related_doc": related_doc,
			"action_url": action_url,
			"icon": icon,
			"priority": priority,
			"created_at": now(),
			"is_read": 0
		})
		
		notification.insert(ignore_permissions=True)
		frappe.db.commit()
		
		print(f"✅ Notification created: {notification.name}")
		
		return {
			"status": "success",
			"message": "Notification created successfully",
			"notification_id": notification.name
		}
		
	except Exception as e:
		frappe.log_error(f"Error creating notification: {str(e)}")
		frappe.throw(_("Failed to create notification"))


@frappe.whitelist()
def delete_notification(notification_id):
	"""Delete a notification"""
	user = frappe.session.user
	
	print(f"🗑️ DEBUG: delete_notification called for {notification_id} by {user}")
	
	try:
		# Security check - user can only delete their own notifications
		notification = frappe.get_doc("User Notification", notification_id)
		if notification.user != user and not frappe.has_permission("User Notification", "delete"):
			frappe.throw(_("Not permitted to delete this notification"))
		
		frappe.delete_doc("User Notification", notification_id)
		frappe.db.commit()
		
		return {
			"status": "success",
			"message": "Notification deleted successfully"
		}
		
	except frappe.DoesNotExistError:
		frappe.throw(_("Notification not found"))
	except Exception as e:
		frappe.log_error(f"Error deleting notification: {str(e)}")
		frappe.throw(_("Failed to delete notification"))


@frappe.whitelist()
def get_notification_count():
	"""Get notification count for current user"""
	user = frappe.session.user
	
	try:
		total_count = frappe.db.count("User Notification", {"user": user})
		unread_count = frappe.db.count("User Notification", {"user": user, "is_read": 0})
		
		return {
			"total_count": total_count,
			"unread_count": unread_count
		}
		
	except Exception as e:
		frappe.log_error(f"Error getting notification count: {str(e)}")
		return {
			"total_count": 0,
			"unread_count": 0
		}


# Helper functions for creating specific notification types

def create_session_notification(user, session_name, session_title, action_type="assigned"):
	"""Create a session-related notification"""
	if action_type == "assigned":
		title = "New Session Assigned"
		message = f"You have been assigned to the training session: {session_title}"
		icon = "calendar"
	elif action_type == "reminder":
		title = "Session Reminder"
		message = f"Your training session '{session_title}' is starting soon"
		icon = "bell"
	else:
		title = "Session Update"
		message = f"Session '{session_title}' has been updated"
		icon = "info"
	
	return create_notification(
		user=user,
		title=title,
		message=message,
		notification_type="session",
		related_doctype="Session",
		related_doc=session_name,
		action_url=f"/surgical_training/session/{session_name}",
		icon=icon,
		priority="medium"
	)


def create_comment_notification(user, session_name, video_title, commenter_name):
	"""Create a comment-related notification"""
	title = "New Comment"
	message = f"{commenter_name} commented on '{video_title}' in session"
	
	return create_notification(
		user=user,
		title=title,
		message=message,
		notification_type="comment",
		related_doctype="Session",
		related_doc=session_name,
		action_url=f"/surgical_training/session/{session_name}",
		icon="message-circle",
		priority="low"
	)


def create_system_notification(user, title, message, priority="medium"):
	"""Create a system notification"""
	return create_notification(
		user=user,
		title=title,
		message=message,
		notification_type="info",
		icon="info",
		priority=priority
	)