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
        
        # Get videos from the session's video table
        print(f"🎬 DEBUG: Processing {len(session.videos)} videos for session '{session_name}'")
        
        for i, video_row in enumerate(session.videos):
            video_file_url = video_row.video_file
            
            print(f"🎬 DEBUG: Video {i+1}/{len(session.videos)}:")
            print(f"   Title: '{video_row.title}'")
            print(f"   Original file_url: '{video_file_url}'")
            
            # Auto-fix corrupted filenames based on video title and detect corruption patterns
            original_file = video_file_url
            
            # Standard mapping for known titles
            if video_row.title == "Camera 1":
                corrected_file = "/files/Compressed_cam1.mp4"
                print(f"   ✅ Mapped Camera 1 -> {corrected_file}")
            elif video_row.title == "Camera 2": 
                corrected_file = "/files/Compressed_cam2.mp4"
                print(f"   ✅ Mapped Camera 2 -> {corrected_file}")
            elif video_row.title == "Camera Monitor":
                corrected_file = "/files/Compressed_monitor.mp4"
                print(f"   ✅ Mapped Camera Monitor -> {corrected_file}")
            elif video_row.title == "Patient Monitor":
                corrected_file = "/files/Compressed_monitor.mp4"
                print(f"   ✅ Mapped Patient Monitor -> {corrected_file}")
            else:
                print(f"   ⚠️ Unknown title '{video_row.title}', checking for corruption...")
                # For unknown titles, check if the filename appears corrupted
                corrected_file = video_file_url
                
                # Check if the file actually exists, if not try to map to an existing one
                if video_file_url and isinstance(video_file_url, str):
                    # Build full path to check if file exists
                    site_path = frappe.utils.get_site_path()
                    
                    if video_file_url.startswith('/files/'):
                        filename = video_file_url.replace('/files/', '')
                    elif video_file_url.startswith('files/'):
                        filename = video_file_url.replace('files/', '')
                    else:
                        filename = video_file_url.split('/')[-1]
                    
                    full_path = os.path.join(site_path, 'public', 'files', filename)
                    
                    if not os.path.exists(full_path):
                        print(f"   ❌ File does not exist: {full_path}")
                        print(f"   ⚠️ Video file missing - user should upload or check filename")
                        
                        # Only apply minimal auto-correction for obviously corrupted names
                        import re
                        if re.search(r'(cam1|cam2|monitor)[a-f0-9]{6,}\.mp4', video_file_url, re.IGNORECASE):
                            # Only fix files with 6+ extra characters (clear corruption)
                            if 'cam1' in video_file_url.lower():
                                corrected_file = "/files/Compressed_cam1.mp4"
                                print(f"   🔧 Severe corruption detected, fixed to cam1: {corrected_file}")
                            elif 'cam2' in video_file_url.lower():
                                corrected_file = "/files/Compressed_cam2.mp4"
                                print(f"   🔧 Severe corruption detected, fixed to cam2: {corrected_file}")
                            elif 'monitor' in video_file_url.lower():
                                corrected_file = "/files/Compressed_monitor.mp4"
                                print(f"   🔧 Severe corruption detected, fixed to monitor: {corrected_file}")
                        else:
                            # Keep original for user to fix manually
                            print(f"   ⚠️ No auto-correction applied - manual fix needed")
                    else:
                        print(f"   ✅ File exists, keeping original: {corrected_file}")
            
            # Use corrected filename if original is corrupted
            if corrected_file != original_file:
                print(f"   🔧 CORRECTION NEEDED: '{original_file}' -> '{corrected_file}'")
                safe_log_error(f"Auto-corrected video filename for '{video_row.title}': '{original_file}' -> '{corrected_file}'")
                video_file_url = corrected_file
                
                # Permanently fix the database record
                try:
                    video_row.video_file = corrected_file
                    session.save()
                    frappe.db.commit()
                    print(f"   💾 Database record permanently fixed for '{video_row.title}'")
                    safe_log_error(f"Permanently fixed database record for '{video_row.title}'")
                except Exception as fix_error:
                    print(f"   ❌ Failed to fix database record: {str(fix_error)}")
                    safe_log_error(f"Failed to fix database record: {str(fix_error)}")
            else:
                print(f"   ✅ No correction needed")
            
            # If video_file is a file attachment, convert to proper serving URL
            print(f"   🔗 Converting to serving URL...")
            print(f"   Input video_file_url: '{video_file_url}'")
            
            if video_file_url and not video_file_url.startswith('/api/method/'):
                # Extract filename from file path
                if video_file_url.startswith('/files/'):
                    filename = video_file_url.replace('/files/', '')
                    print(f"   📁 Extracted filename from /files/ path: '{filename}'")
                elif video_file_url.startswith('files/'):
                    filename = video_file_url.replace('files/', '')
                    print(f"   📁 Extracted filename from files/ path: '{filename}'")
                else:
                    filename = video_file_url.split('/')[-1]  # Get last part of path
                    print(f"   📁 Extracted filename from path end: '{filename}'")
                
                # Create proper serving URL with range request support
                video_file_url = f"/api/method/surgical_training.api.video.serve_video?filename={filename}"
                print(f"   🌐 Final serving URL: '{video_file_url}'")
            else:
                print(f"   ⚠️ Already a serving URL or empty: '{video_file_url}'")
            
            # Validate that the video file exists (use corrected filename for validation)
            file_exists, full_path = validate_file_exists(video_file_url.replace('/api/method/surgical_training.api.video.serve_video?filename=', '/files/') if video_file_url.startswith('/api/method/') else video_file_url)
            if not file_exists:
                missing_files.append(f"Video '{video_row.title}': {video_file_url}")
                continue  # Skip this video if file doesn't exist
            
            video_data = {
                "title": video_row.title,
                "description": video_row.description or "",
                "video_file": video_file_url,
                "duration": video_row.duration or 0  # 0 = auto-detect duration
            }
            print(f"   📦 Final video_data created:")
            print(f"      title: '{video_data['title']}'")
            print(f"      video_file: '{video_data['video_file']}'")
            print(f"   ➕ Adding to videos array...")
            videos.append(video_data)
            print(f"   ✅ Video {i+1} processing complete\n")
        
        # If no videos found in session, show a helpful message
        if not videos:
            print(f"🚨 NO VIDEOS FOUND for session '{session_name}'")
            return {
                "message": "Error", 
                "error": f"No videos found for session '{session_name}'. Please add videos to this session in the admin panel."
            }
        
        print(f"🎬 SUMMARY: Returning {len(videos)} videos for session '{session_name}':")
        for i, video in enumerate(videos):
            print(f"   {i+1}. '{video['title']}' -> '{video['video_file']}'")
        print("=" * 80)
        
        # Get comments for this session - filter to only include comments for current video titles
        user_email = frappe.session.user
        is_admin = user_email == "administrator@gmail.com"
        
        # Get list of current video titles to filter comments
        current_video_titles = [video["title"] for video in videos]
        
        if is_admin:
            # Admin can see all comments, but only for current videos
            comments = frappe.get_list(
                "Video Comment",
                filters={
                    "session": session_name,
                    "video_title": ["in", current_video_titles]  # Only comments for current videos
                },
                fields=["name", "doctor", "video_title", "timestamp", "comment_text", "duration", "comment_type", "created_at"],
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
                fields=["name", "doctor", "video_title", "timestamp", "comment_text", "duration", "comment_type", "created_at"],
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