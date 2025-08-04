# Copyright (c) 2024, None and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class UserNotification(Document):
	def before_insert(self):
		"""Set default values before insert"""
		if not self.created_at:
			self.created_at = frappe.utils.now()
		
		if not self.is_read:
			self.is_read = 0
	
	def validate(self):
		"""Validate notification data"""
		if not self.user:
			frappe.throw("User is required")
		
		if not self.title:
			frappe.throw("Title is required")
		
		if not self.message:
			frappe.throw("Message is required")
		
		if not self.notification_type:
			frappe.throw("Notification type is required")
	
	def mark_as_read(self):
		"""Mark notification as read"""
		if not self.is_read:
			self.is_read = 1
			self.read_at = frappe.utils.now()
			self.save(ignore_permissions=True)
			frappe.db.commit()
	
	def get_formatted_time(self):
		"""Get formatted time for display"""
		if self.created_at:
			return frappe.utils.pretty_date(self.created_at)
		return ""