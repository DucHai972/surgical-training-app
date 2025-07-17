import frappe
from frappe import _
from frappe.utils import now

@frappe.whitelist()
def get_session_assignments():
    """Get all session assignments for admin view"""
    try:
        # Check if user is admin
        if frappe.session.user != "administrator@gmail.com":
            return {"message": "Error", "error": "Access denied. Only administrators can view session assignments."}
        
        # Get all assignments
        assignments = frappe.get_all(
            "Session Assignment",
            fields=["name", "session", "assigned_user", "assigned_by", "assignment_date", "creation", "modified"],
            order_by="creation desc"
        )
        
        return {
            "message": "Success",
            "data": assignments
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting session assignments: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def assign_session_to_user(session_name, user_email):
    """Assign a session to a specific user"""
    try:
        # Check if user is admin
        if frappe.session.user != "administrator@gmail.com":
            return {"message": "Error", "error": "Access denied. Only administrators can assign sessions."}
        
        # Check if assignment already exists
        existing = frappe.get_all(
            "Session Assignment",
            filters={"session": session_name, "assigned_user": user_email},
            fields=["name"]
        )
        
        if existing:
            return {"message": "Error", "error": "Session is already assigned to this user."}
        
        # Create new assignment
        assignment = frappe.get_doc({
            "doctype": "Session Assignment",
            "session": session_name,
            "assigned_user": user_email,
            "assigned_by": frappe.session.user,
            "assignment_date": now()
        })
        assignment.insert(ignore_permissions=True)
        
        return {
            "message": "Success",
            "data": {
                "assignment_name": assignment.name,
                "session": session_name,
                "assigned_user": user_email,
                "assigned_by": frappe.session.user,
                "assignment_date": assignment.assignment_date
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error assigning session: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def remove_session_assignment(assignment_name):
    """Remove a session assignment"""
    try:
        # Check if user is admin
        if frappe.session.user != "administrator@gmail.com":
            return {"message": "Error", "error": "Access denied. Only administrators can remove assignments."}
        
        # Get and delete the assignment
        assignment = frappe.get_doc("Session Assignment", assignment_name)
        assignment.delete(ignore_permissions=True)
        frappe.db.commit()
        
        return {
            "message": "Success",
            "data": {"removed": True, "assignment_name": assignment_name}
        }
        
    except frappe.DoesNotExistError:
        return {"message": "Error", "error": "Assignment not found."}
    except Exception as e:
        frappe.log_error(f"Error removing assignment: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def get_user_assigned_sessions(user_email=None):
    """Get sessions assigned to a specific user"""
    try:
        # If no user_email provided, use current user
        if not user_email:
            user_email = frappe.session.user
        
        # Admin can see all sessions
        if frappe.session.user == "administrator@gmail.com":
            # Get all sessions for admin
            sessions = frappe.get_all(
                "Session",
                fields=["name", "title", "description", "session_date", "status"],
                order_by="creation desc"
            )
        else:
            # Get only assigned sessions for regular users
            assignments = frappe.get_all(
                "Session Assignment",
                filters={"assigned_user": user_email},
                fields=["session"]
            )
            
            if not assignments:
                return {
                    "message": "Success",
                    "data": []
                }
            
            session_names = [a.session for a in assignments]
            sessions = frappe.get_all(
                "Session",
                filters={"name": ["in", session_names]},
                fields=["name", "title", "description", "session_date", "status"],
                order_by="creation desc"
            )
        
        return {
            "message": "Success",
            "data": sessions
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user assigned sessions: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def get_all_users():
    """Get all users for assignment dropdown"""
    try:
        # Check if user is admin
        if frappe.session.user != "administrator@gmail.com":
            return {"message": "Error", "error": "Access denied. Only administrators can view users."}
        
        # Get all users excluding Administrator and Guest
        users = frappe.get_all(
            "User",
            filters={
                "enabled": 1,
                "name": ["not in", ["Administrator", "Guest"]]
            },
            fields=["name", "email", "full_name", "enabled"],
            order_by="full_name asc"
        )
        
        return {
            "message": "Success",
            "data": users
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting users: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def bulk_assign_sessions(user_email, session_names):
    """Assign multiple sessions to a user at once"""
    try:
        # Check if user is admin
        if frappe.session.user != "administrator@gmail.com":
            return {"message": "Error", "error": "Access denied. Only administrators can assign sessions."}
        
        if isinstance(session_names, str):
            import json
            session_names = json.loads(session_names)
        
        results = []
        errors = []
        
        for session_name in session_names:
            try:
                # Check if assignment already exists
                existing = frappe.get_all(
                    "Session Assignment",
                    filters={"session": session_name, "assigned_user": user_email},
                    fields=["name"]
                )
                
                if existing:
                    errors.append(f"Session '{session_name}' is already assigned to this user")
                    continue
                
                # Create new assignment
                assignment = frappe.get_doc({
                    "doctype": "Session Assignment",
                    "session": session_name,
                    "assigned_user": user_email,
                    "assigned_by": frappe.session.user,
                    "assignment_date": now()
                })
                assignment.insert(ignore_permissions=True)
                results.append(session_name)
                
            except Exception as e:
                errors.append(f"Error assigning '{session_name}': {str(e)}")
        
        return {
            "message": "Success",
            "data": {
                "assigned_sessions": results,
                "errors": errors,
                "total_assigned": len(results),
                "total_errors": len(errors)
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error bulk assigning sessions: {str(e)}")
        return {"message": "Error", "error": str(e)}
