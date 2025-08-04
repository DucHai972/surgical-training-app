import frappe

def execute():
    """Create Role Administrator role and assign to administrator@gmail.com"""
    
    # Create Role Administrator role
    role_name = "Role Administrator"
    
    if not frappe.db.exists("Role", role_name):
        role_doc = frappe.get_doc({
            "doctype": "Role",
            "role_name": role_name,
            "disabled": 0,
            "desk_access": 1
        })
        role_doc.insert(ignore_permissions=True)
        print(f"Created role: {role_name}")
    
    # Create Physician role if it doesn't exist
    physician_role = "Physician"
    if not frappe.db.exists("Role", physician_role):
        physician_doc = frappe.get_doc({
            "doctype": "Role",
            "role_name": physician_role,
            "disabled": 0,
            "desk_access": 1
        })
        physician_doc.insert(ignore_permissions=True)
        print(f"Created role: {physician_role}")
    
    # Assign Role Administrator to administrator@gmail.com
    user_email = "administrator@gmail.com"
    
    if frappe.db.exists("User", user_email):
        user_doc = frappe.get_doc("User", user_email)
        
        # Check if role is already assigned
        existing_roles = [role.role for role in user_doc.roles]
        
        if role_name not in existing_roles:
            user_doc.append("roles", {
                "role": role_name
            })
        
        # Also ensure System Manager role
        if "System Manager" not in existing_roles:
            user_doc.append("roles", {
                "role": "System Manager"
            })
        
        user_doc.save(ignore_permissions=True)
        print(f"Updated roles for {user_email}")
    
    frappe.db.commit()
    print("Role setup completed!")