import frappe

def execute():
    """Fix Role Administrator properties to make it appear in user assignment dropdown"""
    
    role_name = "Role Administrator"
    
    try:
        if frappe.db.exists("Role", role_name):
            role_doc = frappe.get_doc("Role", role_name)
            
            # Print current properties for debugging
            print(f"Current Role Administrator properties:")
            print(f"  - disabled: {role_doc.disabled}")
            print(f"  - desk_access: {role_doc.desk_access}")
            print(f"  - restrict_to_domain: {getattr(role_doc, 'restrict_to_domain', 'Not set')}")
            print(f"  - two_factor_auth: {getattr(role_doc, 'two_factor_auth', 'Not set')}")
            
            # Update properties to ensure visibility
            role_doc.disabled = 0
            role_doc.desk_access = 1
            
            # Clear any domain restrictions
            if hasattr(role_doc, 'restrict_to_domain'):
                role_doc.restrict_to_domain = None
            
            # Ensure two factor auth is not required
            if hasattr(role_doc, 'two_factor_auth'):
                role_doc.two_factor_auth = 0
                
            # Save the role
            role_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
            print(f"✅ Updated Role Administrator properties")
            
        else:
            print(f"❌ Role Administrator not found")
            
        # Also check if System Manager role exists and is properly configured
        if frappe.db.exists("Role", "System Manager"):
            sm_role = frappe.get_doc("Role", "System Manager")
            print(f"System Manager role status:")
            print(f"  - disabled: {sm_role.disabled}")
            print(f"  - desk_access: {sm_role.desk_access}")
        else:
            print("❌ System Manager role not found")
            
    except Exception as e:
        print(f"❌ Error updating Role Administrator: {str(e)}")
        frappe.log_error(f"Error fixing Role Administrator: {str(e)}")
        
    # Clear cache to ensure changes take effect
    frappe.clear_cache()
    print("✅ Cache cleared")