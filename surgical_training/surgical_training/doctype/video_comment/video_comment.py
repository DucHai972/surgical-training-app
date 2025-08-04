import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class VideoComment(Document):
    def before_save(self):
        if not self.created_at:
            self.created_at = now_datetime()
            
        # Auto-set the doctor field to current user if it's a Physician
        if not self.doctor and self.has_physician_role():
            self.doctor = frappe.session.user
    
    def before_insert(self):
        # Ensure Physicians can only create comments with their own user
        if self.has_physician_role() and self.doctor != frappe.session.user:
            frappe.throw("You can only create comments as yourself")
    
    def validate(self):
        # Validate the timestamp is within video duration
        self.validate_timestamp_in_video_range()
        
        # Enforce row-level security for Physicians
        self.validate_physician_access()
    
    def validate_timestamp_in_video_range(self):
        """Validate that the timestamp is within the video duration"""
        session = frappe.get_doc("Session", self.session)
        
        # Find the video with the matching title
        video_found = False
        for video in session.videos:
            if video.title == self.video_title:
                video_found = True
                if video.duration and self.timestamp > video.duration:
                    frappe.throw(f"Timestamp {self.timestamp} is greater than video duration {video.duration}")
                break
        
        if not video_found:
            frappe.throw(f"Video with title '{self.video_title}' not found in session {self.session}")
    
    def validate_physician_access(self):
        """Ensure Physicians can only access their own comments"""
        if self.has_physician_role():
            if self.doctor != frappe.session.user:
                frappe.throw("You can only access your own comments")
    
    def has_physician_role(self):
        """Check if current user has Physician role"""
        return "Physician" in frappe.get_roles(frappe.session.user)
    
    def has_system_manager_role(self):
        """Check if current user has System Manager role"""
        return "System Manager" in frappe.get_roles(frappe.session.user)

# Hook functions for permission control
def get_permission_query_conditions(user):
    """
    Filter Video Comments based on user role:
    - System Managers can see all comments
    - Physicians can only see their own comments
    """
    if not user:
        user = frappe.session.user
    
    # System Managers can see everything
    if "System Manager" in frappe.get_roles(user):
        return ""
    
    # Physicians can only see their own comments
    if "Physician" in frappe.get_roles(user):
        return f"`tabVideo Comment`.doctor = '{user}'"
    
    # Default: no access
    return "1=0"

def has_permission(doc, user):
    """
    Check if user has permission to access this Video Comment:
    - System Managers can access all comments
    - Physicians can only access their own comments
    """
    if not user:
        user = frappe.session.user
    
    # System Managers can access everything
    if "System Manager" in frappe.get_roles(user):
        return True
    
    # Physicians can only access their own comments
    if "Physician" in frappe.get_roles(user):
        return doc.doctor == user
    
    # Default: no access
    return False 