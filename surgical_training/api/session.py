import frappe
from frappe import _
from frappe.utils import cint
import json

@frappe.whitelist()
def get_sessions():
    """Get all active sessions"""
    try:
        sessions = frappe.get_list(
            "Session",
            filters={"status": "Active"},
            fields=["name", "title", "description", "session_date", "status"]
        )
        
        # Convert session_date to string format for JSON serialization
        for session in sessions:
            if session.get("session_date"):
                session["session_date"] = str(session["session_date"])
        
        # Return a valid JSON response - return directly without nesting
        return {"message": "Success", "data": sessions}
    except BrokenPipeError as e:
        frappe.log_error(f"BrokenPipeError in get_sessions: {str(e)}")
        return {"message": "Error", "error": "Connection error. Please try again."}
    except Exception as e:
        frappe.log_error(f"Error getting sessions: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def update_session_titles_directly():
    """Update session titles directly using SQL"""
    try:
        # Update SS 1 to Scenario: Anaphylaxis
        frappe.db.sql("UPDATE `tabSession` SET title = 'Scenario: Anaphylaxis' WHERE name = 'SS 1'")
        
        # Update Session 2 to Scenario: Sepsis
        frappe.db.sql("UPDATE `tabSession` SET title = 'Scenario: Sepsis' WHERE name = 'Session 2'")
        
        # Commit changes
        frappe.db.commit()
        
        # Check the results
        sessions = frappe.db.sql("SELECT name, title FROM `tabSession`", as_dict=True)
        
        return {"message": "Success", "data": sessions}
    except Exception as e:
        frappe.log_error(f"Error updating session titles: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def update_session_title(session_name, new_title):
    """Update a session's title"""
    if not session_name:
        return {"message": "Error", "error": "Session name is required"}
    
    if not new_title:
        return {"message": "Error", "error": "New title is required"}
    
    try:
        # Check if session exists
        if not frappe.db.exists("Session", session_name):
            return {"message": "Error", "error": "Session not found"}
        
        # Get the session document
        session_doc = frappe.get_doc("Session", session_name)
        
        # Update the title
        session_doc.title = new_title
        session_doc.save()
        frappe.db.commit()
        
        return {"message": "Success", "data": "Session title updated successfully"}
    except Exception as e:
        frappe.log_error(f"Error updating session {session_name}: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def delete_session(session_name):
    """Delete a session"""
    if not session_name:
        return {"message": "Error", "error": "Session name is required"}
    
    try:
        # Check if session exists
        if not frappe.db.exists("Session", session_name):
            return {"message": "Error", "error": "Session not found"}
        
        # Delete the session
        frappe.delete_doc("Session", session_name)
        frappe.db.commit()
        
        return {"message": "Success", "data": "Session deleted successfully"}
    except Exception as e:
        frappe.log_error(f"Error deleting session {session_name}: {str(e)}")
        return {"message": "Error", "error": str(e)}
    
@frappe.whitelist()
def get_session_details(session_name):
    """Get details of a session including videos"""
    if not session_name:
        return {"message": "Error", "error": "Session name is required"}
    
    try:
        session = frappe.get_doc("Session", session_name)
        videos = []
        
        for video in session.videos:
            videos.append({
                "title": video.title,
                "description": video.description,
                "video_file": video.video_file,
                "duration": video.duration
            })
        
        # Get comments for this session
        comments = frappe.get_list(
            "Video Comment",
            filters={"session": session_name},
            fields=["name", "doctor", "video_title", "timestamp", "comment_text", "created_at"],
            order_by="created_at desc"
        )
        
        # Convert datetime objects to string for proper JSON serialization
        session_date = str(session.session_date) if session.session_date else ""
        
        data = {
            "session": {
                "name": session.name,
                "title": session.title,
                "description": session.description,
                "session_date": session_date,
                "status": session.status
            },
            "videos": videos,
            "comments": comments
        }
        
        # Return directly without nesting
        return {"message": "Success", "data": data}
    except BrokenPipeError as e:
        frappe.log_error(f"BrokenPipeError in get_session_details: {str(e)}")
        return {"message": "Error", "error": "Connection error. Please try again."}
    except Exception as e:
        frappe.log_error(f"Error getting session details: {str(e)}")
        return {"message": "Error", "error": str(e)} 