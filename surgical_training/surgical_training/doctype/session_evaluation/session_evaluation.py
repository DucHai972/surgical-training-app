# Copyright (c) 2023, UCC and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SessionEvaluation(Document):
    def validate(self):
        self.calculate_total_score()
    
    def calculate_total_score(self):
        """Calculate the total score from all evaluation criteria"""
        fields = [
            "identification", "situation", "history", 
            "examination", "assessment", "recommendation", "grs"
        ]
        
        total = 0
        for field in fields:
            if self.get(field):
                try:
                    total += int(self.get(field))
                except ValueError:
                    # In case the value is not a valid integer
                    pass
        
        self.total_score = total 