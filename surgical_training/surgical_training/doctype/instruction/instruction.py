import frappe
from frappe.model.document import Document
from frappe.utils import now

class Instruction(Document):
    def before_save(self):
        """Update last_updated timestamp when saving"""
        self.last_updated = now()
    
    def validate(self):
        """Validate instruction data"""
        # Ensure section_id is URL-friendly
        if self.section_id:
            import re
            self.section_id = re.sub(r'[^a-zA-Z0-9-_]', '-', self.section_id.lower())
        
        # Set default order if not specified
        if not self.order_index:
            # Get highest order index and add 1
            max_order = frappe.db.sql("""
                SELECT COALESCE(MAX(order_index), 0) as max_order 
                FROM `tabInstruction` 
                WHERE category = %s
            """, (self.category,))
            self.order_index = (max_order[0][0] if max_order else 0) + 1