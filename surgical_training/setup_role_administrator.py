#!/usr/bin/env python3
"""
Setup script to create Role Administrator role and assign it to administrator@gmail.com
"""

import frappe
from frappe import _

def setup_role_administrator():
    """Create Role Administrator role with full permissions and assign to administrator@gmail.com"""
    
    try:
        # Create Role Administrator role
        role_name = "Role Administrator"
        
        # Check if role already exists
        if not frappe.db.exists("Role", role_name):
            role_doc = frappe.get_doc({
                "doctype": "Role",
                "role_name": role_name,
                "disabled": 0,
                "desk_access": 1,
                "home_page": "",
                "restrict_to_domain": "",
                "two_factor_auth": 0
            })
            role_doc.insert(ignore_permissions=True)
            print(f"✅ Created role: {role_name}")
        else:
            print(f"ℹ️ Role {role_name} already exists")
        
        # Get all doctypes in the surgical_training app
        surgical_training_doctypes = [
            "Session",
            "Session Video", 
            "Video Comment",
            "Session Assignment",
            "Session Evaluation",
            "Comment Template",
            "Category Evaluation",
            "Evaluation Detail",
            "Video Timestamp",
            "Doctor"
        ]
        
        # Core doctypes that Role Administrator should have access to
        core_doctypes = [
            "User",
            "Role",
            "DocType",
            "Custom Field",
            "Property Setter",
            "Print Format",
            "Report",
            "Dashboard",
            "Workspace",
            "System Settings",
            "Error Log",
            "Activity Log"
        ]
        
        all_doctypes = surgical_training_doctypes + core_doctypes
        
        # Create permissions for each doctype
        for doctype in all_doctypes:
            if frappe.db.exists("DocType", doctype):
                # Check if permission already exists
                existing_perm = frappe.db.exists("Custom DocPerm", {
                    "parent": doctype,
                    "role": role_name
                })
                
                if not existing_perm:
                    # Create full permissions
                    perm_doc = frappe.get_doc({
                        "doctype": "Custom DocPerm",
                        "parent": doctype,
                        "parenttype": "DocType",
                        "parentfield": "permissions",
                        "role": role_name,
                        "read": 1,
                        "write": 1,
                        "create": 1,
                        "delete": 1,
                        "submit": 1,
                        "cancel": 1,
                        "amend": 1,
                        "report": 1,
                        "export": 1,
                        "import": 1,
                        "set_user_permissions": 1,
                        "share": 1,
                        "print": 1,
                        "email": 1
                    })
                    perm_doc.insert(ignore_permissions=True)
                    print(f"✅ Added permissions for {doctype}")
                else:
                    print(f"ℹ️ Permissions for {doctype} already exist")
        
        # Assign role to administrator@gmail.com
        user_email = "administrator@gmail.com"
        
        if frappe.db.exists("User", user_email):
            user_doc = frappe.get_doc("User", user_email)
            
            # Check if role is already assigned
            has_role = any(role.role == role_name for role in user_doc.roles)
            
            if not has_role:
                user_doc.append("roles", {
                    "role": role_name
                })
                user_doc.save(ignore_permissions=True)
                print(f"✅ Assigned {role_name} role to {user_email}")
            else:
                print(f"ℹ️ {user_email} already has {role_name} role")
        else:
            print(f"❌ User {user_email} not found")
        
        # Commit changes
        frappe.db.commit()
        print("✅ Setup completed successfully!")
        
        return True
        
    except Exception as e:
        frappe.db.rollback()
        print(f"❌ Error during setup: {str(e)}")
        frappe.log_error(f"Role Administrator setup error: {str(e)}")
        return False

if __name__ == "__main__":
    setup_role_administrator()