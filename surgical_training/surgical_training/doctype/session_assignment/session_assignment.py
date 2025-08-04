# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now

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
        
        # Validate status transitions and timestamps
        self.validate_status_transitions()
        
        # Update comment count
        self.update_comment_count()
    
    def before_insert(self):
        if not self.assignment_date:
            self.assignment_date = now()
        
        if not self.assigned_by:
            self.assigned_by = frappe.session.user
            
        # Set default status
        if not self.doctor_status:
            self.doctor_status = "Not Started"
    
    def validate_status_transitions(self):
        """Validate status changes and update timestamps accordingly"""
        if not self.doctor_status:
            return
            
        # Auto-set started_at when status changes to "In Progress"
        if self.doctor_status == "In Progress" and not self.started_at:
            self.started_at = now()
            
        # Auto-set completed_at when status changes to "Completed" 
        elif self.doctor_status == "Completed" and not self.completed_at:
            self.completed_at = now()
            
        # Clear completed_at if status is changed back from "Completed"
        elif self.doctor_status != "Completed" and self.completed_at:
            self.completed_at = None
    
    def update_comment_count(self):
        """Update the total comment count for this doctor on this session"""
        if self.session and self.assigned_user:
            comment_count = frappe.db.count("Video Comment", {
                "session": self.session,
                "doctor": self.assigned_user
            })
            self.total_comments = comment_count
    
    def can_edit_status(self, user=None):
        """Check if a user can edit the status of this assignment"""
        if not user:
            user = frappe.session.user
            
        # System managers can edit any status
        if "System Manager" in frappe.get_roles(user):
            return True
            
        # Doctors can only edit their own assignments
        if "Physician" in frappe.get_roles(user) and self.assigned_user == user:
            return True
            
        return False

# Permission hooks for row-level security
def get_permission_query_conditions(user):
    """
    Filter Session Assignments based on user role:
    - System Managers can see all assignments
    - Physicians can only see their own assignments
    """
    if not user:
        user = frappe.session.user
    
    # System Managers can see everything
    if "System Manager" in frappe.get_roles(user):
        return ""
    
    # Physicians can only see their own assignments
    if "Physician" in frappe.get_roles(user):
        return f"`tabSession Assignment`.assigned_user = '{user}'"
    
    # Default: no access
    return "1=0"

def has_permission(doc, user):
    """
    Check if user has permission to access this Session Assignment:
    - System Managers can access all assignments
    - Physicians can only access their own assignments
    """
    if not user:
        user = frappe.session.user
    
    # System Managers can access everything
    if "System Manager" in frappe.get_roles(user):
        return True
    
    # Physicians can only access their own assignments
    if "Physician" in frappe.get_roles(user):
        return doc.assigned_user == user
    
    # Default: no access
    return False 