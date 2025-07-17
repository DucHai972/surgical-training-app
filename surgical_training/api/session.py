import frappe
from frappe import _
from frappe.utils import cint
import json
import os, shutil


def safe_log_error(error_message, title="Session Error"):
    """Log error with character limit consideration"""
    # Frappe error log field has 140 character limit
    max_length = 130  # Leave some buffer
    
    if len(error_message) > max_length:
        truncated = error_message[:max_length-3] + "..."
        try:
            frappe.log_error(truncated, title)
        except Exception:
            # If even this fails, use print fallback
            print(f"Error logging failed: {error_message}")
    else:
        try:
            frappe.log_error(error_message, title)
        except Exception:
            # If even this fails, use print fallback
            print(f"Error logging failed: {error_message}")

def validate_file_exists(file_path):
    """Check if a file exists in the expected locations"""
    if not file_path:
        return False, None
    
    import os
    site_path = frappe.get_site_path()
    
    # Clean the file path
    clean_path = file_path.lstrip('/')
    
    # Check both public and private directories
    possible_paths = [
        os.path.join(site_path, "public", clean_path),
        os.path.join(site_path, "private", clean_path),
        os.path.join(site_path, clean_path)  # Direct path
    ]
    
    for full_path in possible_paths:
        if os.path.exists(full_path) and os.path.isfile(full_path):
            # Additional check: ensure file is not empty (>0 bytes)
            if os.path.getsize(full_path) > 0:
                return True, full_path
    
    # Debug: Log what we're looking for
    print(f"🔍 DEBUG: File not found - {file_path}")
    print(f"    Checked paths: {possible_paths}")
    
    return False, None

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
        safe_log_error(f"BrokenPipeError in get_sessions: {str(e)}")
        return {"message": "Error", "error": "Connection error. Please try again."}
    except Exception as e:
        safe_log_error(f"Error getting sessions: {str(e)}")
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
        safe_log_error(f"Error updating session titles: {str(e)}")
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
        safe_log_error(f"Error updating session {session_name}: {str(e)}")
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
        safe_log_error(f"Error deleting session {session_name}: {str(e)}")
        return {"message": "Error", "error": str(e)}
    
@frappe.whitelist()
def get_session_details(session_name):
    """Get details of a session including videos"""
    if not session_name:
        return {"message": "Error", "error": "Session name is required"}
    
    try:
        session = frappe.get_doc("Session", session_name)
        videos = []
        missing_files = []
        
        # Hardcode the 3 compressed videos for all sessions - served locally for better seeking
        hardcoded_videos = [
            {
                "title": "Camera 1",
                "description": "Main surgical camera view",
                "video_file": "http://localhost:8080/assets/surgical_training/frontend/Compressed_cam1.mp4",
                "duration": 0  # Duration will be determined by video player (0 = auto-detect)
            },
            {
                "title": "Camera 2", 
                "description": "Secondary surgical camera view",
                "video_file": "http://localhost:8080/assets/surgical_training/frontend/Compressed_cam2.mp4",
                "duration": 0
            },
            {
                "title": "Patient Monitor",
                "description": "Patient monitoring display",
                "video_file": "http://localhost:8080/assets/surgical_training/frontend/Compressed_monitor.mp4", 
                "duration": 0
            }
        ]
        
        videos = hardcoded_videos
        
        # Get comments for this session - filter to only include comments for current video titles
        user_email = frappe.session.user
        is_admin = user_email == "administrator@gmail.com"
        
        # Get list of current video titles to filter comments
        current_video_titles = [video["title"] for video in hardcoded_videos]
        
        if is_admin:
            # Admin can see all comments, but only for current videos
            comments = frappe.get_list(
                "Video Comment",
                filters={
                    "session": session_name,
                    "video_title": ["in", current_video_titles]  # Only comments for current videos
                },
                fields=["name", "doctor", "video_title", "timestamp", "comment_text", "created_at"],
                order_by="created_at desc"
            )
        else:
            # Only show comments for this doctor user and current videos
            possible_doctor_names = []
            # Try to get Doctor record for this user
            try:
                doctors = frappe.get_list("Doctor", filters={"user": user_email})
                if doctors:
                    possible_doctor_names.append(doctors[0].name)
            except Exception:
                pass
            # Always add fallback
            possible_doctor_names.append(f"doctor-{user_email}")
            
            comments = frappe.get_list(
                "Video Comment",
                filters={
                    "session": session_name,
                    "doctor": ["in", possible_doctor_names],
                    "video_title": ["in", current_video_titles]  # Only comments for current videos
                },
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
            "comments": comments,
            "warnings": {
                "missing_files": missing_files
            } if missing_files else {}
        }
        
        # Return directly without nesting
        return {"message": "Success", "data": data}
    except BrokenPipeError as e:
        safe_log_error(f"BrokenPipe in session {session_name[:20]}: {str(e)[:50]}")
        return {"message": "Error", "error": "Connection error. Please try again."}
    except Exception as e:
        safe_log_error(f"Session error {session_name[:20]}: {str(e)[:50]}")
        return {"message": "Error", "error": str(e)} 