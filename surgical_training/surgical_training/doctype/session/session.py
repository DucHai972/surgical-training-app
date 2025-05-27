import frappe
from frappe.model.document import Document

class Session(Document):
    def before_save(self):
        self.validate_videos()
    
    def validate_videos(self):
        """Ensure at least one video is attached to the session"""
        if not self.videos or len(self.videos) == 0:
            frappe.throw("At least one video must be attached to the session") 