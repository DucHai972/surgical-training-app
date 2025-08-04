import frappe
import os
import shutil
from frappe import _

@frappe.whitelist()
def create_fallback_video(missing_filename, fallback_filename="Compressed_cam1.mp4"):
    """
    Create a symlink for a missing video file to point to an existing video
    """
    print(f"🔧 CREATE_FALLBACK_VIDEO: '{missing_filename}' -> '{fallback_filename}'")
    
    if not missing_filename:
        return {
            "message": "Error",
            "error": "Missing filename is required"
        }
    
    try:
        # Get site path
        site_path = frappe.utils.get_site_path()
        files_dir = os.path.join(site_path, 'public', 'files')
        
        # Clean filenames
        missing_clean = missing_filename.replace('/files/', '').replace('files/', '')
        fallback_clean = fallback_filename.replace('/files/', '').replace('files/', '')
        
        missing_path = os.path.join(files_dir, missing_clean)
        fallback_path = os.path.join(files_dir, fallback_clean)
        
        print(f"   Missing file path: {missing_path}")
        print(f"   Fallback file path: {fallback_path}")
        
        # Check if fallback file exists
        if not os.path.exists(fallback_path):
            print(f"   ❌ Fallback file does not exist: {fallback_path}")
            return {
                "message": "Error",
                "error": f"Fallback video '{fallback_clean}' does not exist"
            }
        
        # Check if missing file already exists
        if os.path.exists(missing_path):
            print(f"   ⚠️ File already exists: {missing_path}")
            return {
                "message": "Success",
                "data": f"File '{missing_clean}' already exists"
            }
        
        # Create symlink
        os.symlink(fallback_path, missing_path)
        print(f"   ✅ Created symlink: {missing_path} -> {fallback_path}")
        
        return {
            "message": "Success",
            "data": f"Created fallback video symlink for '{missing_clean}' pointing to '{fallback_clean}'"
        }
        
    except Exception as e:
        print(f"   ❌ Error creating fallback video: {str(e)}")
        frappe.logger().error(f"Error creating fallback video: {str(e)}")
        return {
            "message": "Error",
            "error": f"Failed to create fallback video: {str(e)}"
        }

@frappe.whitelist()
def list_available_videos():
    """
    List all available video files in the public/files directory
    """
    print("📁 LISTING AVAILABLE VIDEOS")
    
    try:
        site_path = frappe.utils.get_site_path()
        files_dir = os.path.join(site_path, 'public', 'files')
        
        # Find all video files
        video_extensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv']
        video_files = []
        
        if os.path.exists(files_dir):
            for file in os.listdir(files_dir):
                if any(file.lower().endswith(ext) for ext in video_extensions):
                    file_path = os.path.join(files_dir, file)
                    file_info = {
                        "filename": file,
                        "size": os.path.getsize(file_path),
                        "is_symlink": os.path.islink(file_path),
                        "target": os.readlink(file_path) if os.path.islink(file_path) else None
                    }
                    video_files.append(file_info)
                    print(f"   📹 {file} ({file_info['size']} bytes)" + 
                          (f" -> {file_info['target']}" if file_info['is_symlink'] else ""))
        
        print(f"   📊 Total videos found: {len(video_files)}")
        
        return {
            "message": "Success",
            "data": {
                "video_files": video_files,
                "count": len(video_files),
                "directory": files_dir
            }
        }
        
    except Exception as e:
        print(f"   ❌ Error listing videos: {str(e)}")
        frappe.logger().error(f"Error listing videos: {str(e)}")
        return {
            "message": "Error",
            "error": f"Failed to list videos: {str(e)}"
        }

@frappe.whitelist()
def auto_fix_missing_videos():
    """
    Automatically create fallback symlinks for any missing videos in all sessions
    """
    print("🔧 AUTO-FIX MISSING VIDEOS")
    
    try:
        # Get all sessions with videos
        sessions = frappe.get_all("Session", 
                                 fields=["name", "title"],
                                 filters={"docstatus": 0})
        
        missing_videos = []
        fixed_videos = []
        
        site_path = frappe.utils.get_site_path()
        files_dir = os.path.join(site_path, 'public', 'files')
        
        for session in sessions:
            session_doc = frappe.get_doc("Session", session.name)
            
            for video_row in session_doc.videos:
                if video_row.video_file:
                    # Clean filename
                    filename = video_row.video_file
                    if filename.startswith('/files/'):
                        filename = filename.replace('/files/', '')
                    elif filename.startswith('files/'):
                        filename = filename.replace('files/', '')
                    else:
                        filename = filename.split('/')[-1]
                    
                    full_path = os.path.join(files_dir, filename)
                    
                    if not os.path.exists(full_path):
                        missing_videos.append({
                            "session": session.name,
                            "video_title": video_row.title,
                            "filename": filename,
                            "original_path": video_row.video_file
                        })
                        
                        # Only create fallback for severely corrupted filenames, not missing videos
                        import re
                        if re.search(r'(cam1|cam2|monitor)[a-f0-9]{6,}\.mp4', filename, re.IGNORECASE):
                            # Determine correct target based on corruption pattern
                            if 'cam1' in filename.lower():
                                fallback = "Compressed_cam1.mp4"
                            elif 'cam2' in filename.lower():
                                fallback = "Compressed_cam2.mp4"
                            elif 'monitor' in filename.lower():
                                fallback = "Compressed_monitor.mp4"
                            else:
                                fallback = "Compressed_cam1.mp4"  # Default fallback
                            
                            result = create_fallback_video(filename, fallback)
                            if result["message"] == "Success":
                                fixed_videos.append({
                                    "session": session.name,
                                    "video_title": video_row.title,
                                    "filename": filename,
                                    "result": result["data"]
                                })
        
        print(f"   📊 Found {len(missing_videos)} missing videos")
        print(f"   ✅ Fixed {len(fixed_videos)} videos")
        
        return {
            "message": "Success",
            "data": {
                "missing_videos": missing_videos,
                "fixed_videos": fixed_videos,
                "total_missing": len(missing_videos),
                "total_fixed": len(fixed_videos)
            }
        }
        
    except Exception as e:
        print(f"   ❌ Error auto-fixing videos: {str(e)}")
        frappe.logger().error(f"Error auto-fixing videos: {str(e)}")
        return {
            "message": "Error",
            "error": f"Failed to auto-fix videos: {str(e)}"
        } 
 
 