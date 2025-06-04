import frappe
from frappe import _
import json

@frappe.whitelist()
def add_evaluation(**kwargs):
    try:
        # Log received data for debugging
        frappe.logger().debug(f"Received evaluation data: {kwargs}")
        
        # Validate required fields
        required_fields = ["session", "identification", "situation", "history", 
                          "examination", "assessment", "recommendation", "grs"]
        
        missing_fields = []
        for field in required_fields:
            if not kwargs.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            frappe.logger().error(error_msg)
            return {
                "message": "Error",
                "error": error_msg
            }
        
        # Verify session exists
        session_name = kwargs.get("session")
        if not frappe.db.exists("Session", session_name):
            error_msg = f"Session {session_name} does not exist"
            frappe.logger().error(error_msg)
            return {
                "message": "Error",
                "error": error_msg
            }
        
        # Get current user
        doctor = frappe.session.user
        frappe.logger().debug(f"Doctor submitting evaluation: {doctor}")
        
        # Create new evaluation document
        evaluation = frappe.get_doc({
            "doctype": "Session Evaluation",
            "session": kwargs.get("session"),
            "doctor": doctor,
            "identification": kwargs.get("identification"),
            "situation": kwargs.get("situation"),
            "history": kwargs.get("history"),
            "examination": kwargs.get("examination"),
            "assessment": kwargs.get("assessment"),
            "recommendation": kwargs.get("recommendation"),
            "grs": kwargs.get("grs"),
            "comment": kwargs.get("comment", "")
        })
        
        # Save to database
        evaluation.insert(ignore_permissions=True)
        frappe.db.commit()
        
        frappe.logger().info(f"Evaluation {evaluation.name} saved successfully")
        return {
            "message": "Success",
            "data": {
                "name": evaluation.name
            }
        }
        
    except frappe.exceptions.ValidationError as e:
        frappe.db.rollback()
        frappe.log_error(title="Validation Error in add_evaluation", message=str(e))
        return {
            "message": "Error",
            "error": f"Validation error: {str(e)}"
        }
    except frappe.exceptions.PermissionError as e:
        frappe.db.rollback()
        frappe.log_error(title="Permission Error in add_evaluation", message=str(e))
        return {
            "message": "Error",
            "error": "You don't have permission to add evaluations"
        }
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Error in add_evaluation", message=str(e))
        return {
            "message": "Error",
            "error": str(e)
        }

@frappe.whitelist()
def get_session_evaluations(session_name):
    """Get all evaluations for a session in a format suitable for export"""
    if not session_name:
        return {
            "message": "Error",
            "error": "Session name is required"
        }
    
    try:
        # Get the session details
        session = frappe.get_doc("Session", session_name)
        
        # Get all evaluations for this session
        evaluations = frappe.get_list(
            "Session Evaluation",
            filters={"session": session_name},
            fields=["name", "doctor", "identification", "situation", "history", 
                   "examination", "assessment", "recommendation", "grs", 
                   "comment", "creation", "modified"]
        )
        
        # Enrich data with doctor's full name
        for evaluation in evaluations:
            if evaluation.get("doctor"):
                user = frappe.get_doc("User", evaluation["doctor"])
                evaluation["doctor_name"] = user.full_name
            
            # Convert datetime objects to string for JSON serialization
            if evaluation.get("creation"):
                evaluation["creation"] = str(evaluation["creation"])
            if evaluation.get("modified"):
                evaluation["modified"] = str(evaluation["modified"])
        
        # Prepare the export data
        export_data = {
            "session": {
                "name": session.name,
                "title": session.title,
                "description": session.description,
                "session_date": str(session.session_date) if session.session_date else "",
                "status": session.status
            },
            "evaluations": evaluations
        }
        
        return {
            "message": "Success",
            "data": export_data
        }
        
    except Exception as e:
        frappe.log_error(title="Error in get_session_evaluations", message=str(e))
        return {
            "message": "Error",
            "error": str(e)
        } 