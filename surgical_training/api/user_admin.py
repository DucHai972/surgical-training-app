import frappe

@frappe.whitelist()
def add_doctor_role_to_user(email="doctor@gmail.com"):
    """Add Doctor role to a user"""
    try:
        # Check if user exists
        if not frappe.db.exists('User', email):
            return {
                'success': False,
                'message': f'User {email} does not exist'
            }
        
        # Get the user document
        user = frappe.get_doc('User', email)
        
        # Check current roles
        current_roles = [role.role for role in user.roles]
        
        # Add Doctor role if not already present
        if 'Doctor' not in current_roles:
            user.append('roles', {'role': 'Doctor'})
            user.save(ignore_permissions=True)
            frappe.db.commit()
            message = f'✅ Doctor role added to {email}'
        else:
            message = f'✅ User {email} already has Doctor role'
        
        # Get updated roles
        updated_user = frappe.get_doc('User', email)
        final_roles = [role.role for role in updated_user.roles]
        
        return {
            'success': True,
            'message': message,
            'user_email': email,
            'roles': final_roles
        }
        
    except Exception as e:
        frappe.log_error(f"Error adding Doctor role: {str(e)}")
        return {
            'success': False,
            'message': f'Error: {str(e)}'
        }

@frappe.whitelist()
def get_user_roles(email="doctor@gmail.com"):
    """Get current roles for a user"""
    try:
        if not frappe.db.exists('User', email):
            return {
                'success': False,
                'message': f'User {email} does not exist'
            }
        
        user = frappe.get_doc('User', email)
        roles = [role.role for role in user.roles]
        
        return {
            'success': True,
            'user_email': email,
            'full_name': user.full_name,
            'enabled': user.enabled,
            'roles': roles
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error: {str(e)}'
        }