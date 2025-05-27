import frappe
from frappe import _
import json

__all__ = ['get_evaluation_statistics', 'add_evaluation', 'get_session_evaluations']

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

@frappe.whitelist(allow_guest=False)
def get_evaluation_statistics():
    """Return statistics for all session evaluations"""
    try:
        frappe.logger().debug("Starting get_evaluation_statistics")
        
        # Check if user is authenticated
        if frappe.session.user == "Guest":
            frappe.logger().warning("Guest user attempted to access statistics")
            frappe.throw("Authentication required", frappe.AuthenticationError)
        
        # Fields to analyze
        score_fields = [
            "identification", "situation", "history", "examination", 
            "assessment", "recommendation", "grs"
        ]
        
        # Get all evaluations
        try:
            evaluations = frappe.get_all(
                "Session Evaluation",
                fields=["session"] + score_fields,
                ignore_permissions=True  # Allow access to all evaluations
            )
            frappe.logger().debug(f"Found {len(evaluations)} evaluations")
        except Exception as e:
            frappe.logger().error(f"Error fetching evaluations: {str(e)}")
            frappe.logger().error(frappe.get_traceback())
            return {
                "message": "Error",
                "error": f"Failed to fetch evaluations: {str(e)}"
            }

        if not evaluations:
            return {
                "message": "Success",
                "data": {
                    "total": 0,
                    "sessions": {},
                    "averages": {},
                    "counts": {},
                    "score_distributions": {}
                }
            }

        # Aggregate by session
        session_stats = {}
        field_totals = {field: 0 for field in score_fields}
        field_counts = {field: 0 for field in score_fields}
        score_distributions = {field: {str(i): 0 for i in range(4)} for field in score_fields}

        for eval in evaluations:
            session = eval["session"]
            if session not in session_stats:
                session_stats[session] = {"count": 0, **{field: 0 for field in score_fields}}
            session_stats[session]["count"] += 1
            
            for field in score_fields:
                value = eval.get(field)
                if value is not None:
                    try:
                        value_int = int(value)
                        session_stats[session][field] += value_int
                        field_totals[field] += value_int
                        field_counts[field] += 1
                        score_distributions[field][str(value_int)] += 1
                    except (ValueError, TypeError) as e:
                        frappe.logger().warning(f"Invalid value for {field} in session {session}: {value}")

        # Calculate averages
        field_averages = {
            field: (field_totals[field] / field_counts[field]) if field_counts[field] else 0 
            for field in score_fields
        }

        result = {
            "message": "Success",
            "data": {
                "total": len(evaluations),
                "sessions": session_stats,
                "averages": field_averages,
                "counts": field_counts,
                "score_distributions": score_distributions
            }
        }
        
        frappe.logger().debug("Successfully generated statistics")
        return result

    except frappe.AuthenticationError as e:
        frappe.logger().error(f"Authentication error in get_evaluation_statistics: {str(e)}")
        return {
            "message": "Error",
            "error": "Authentication required"
        }
    except Exception as e:
        frappe.logger().error(f"Error in get_evaluation_statistics: {str(e)}")
        frappe.logger().error(frappe.get_traceback())
        return {
            "message": "Error",
            "error": str(e)
        } 