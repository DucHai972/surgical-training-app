import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class VideoComment(Document):
    def before_save(self):
        if not self.created_at:
            self.created_at = now_datetime()
    
    def validate(self):
        # Validate the timestamp is within video duration
        self.validate_timestamp_in_video_range()
    
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