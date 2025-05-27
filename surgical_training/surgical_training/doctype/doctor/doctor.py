import frappe
from frappe.model.document import Document

class Doctor(Document):
    def validate(self):
        self.set_full_name()
    
    def set_full_name(self):
        # Get the full name from the linked User
        if self.user:
            user = frappe.get_doc("User", self.user)
            if user:
                self.full_name = user.full_name 