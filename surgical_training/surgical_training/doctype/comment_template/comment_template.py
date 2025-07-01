# Copyright (c) 2024, Surgical Training and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CommentTemplate(Document):
	def validate(self):
		# Ensure the user can only create templates for themselves
		if not self.owner:
			self.owner = frappe.session.user 