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