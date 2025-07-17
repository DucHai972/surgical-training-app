# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SessionAssignment(Document):
    def validate(self):
        # Check for duplicate assignments
        existing = frappe.get_all(
            "Session Assignment",
            filters={
                "session": self.session,
                "assigned_user": self.assigned_user,
                "name": ["!=", self.name or ""]
            }
        )
        
        if existing:
            frappe.throw(f"Session '{self.session}' is already assigned to user '{self.assigned_user}'")
    
    def before_insert(self):
        if not self.assignment_date:
            self.assignment_date = frappe.utils.now()
        
        if not self.assigned_by:
            self.assigned_by = frappe.session.user 