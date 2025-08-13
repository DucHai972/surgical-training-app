import frappe
import os
from frappe.utils import cstr
from werkzeug.wrappers import Response
import mimetypes

def _serve_video_file(file_path):
    """
    Common video serving logic with range request support
    """
    print(f"🗂️ _SERVE_VIDEO_FILE:")
    print(f"   Input file_path: '{file_path}'")
    
    # Build the full file path - check both public and private directories
    site_path = frappe.utils.get_site_path()
    print(f"   Site path: '{site_path}'")
    
    # Try multiple possible paths for the file
    possible_paths = []
    
    if file_path.startswith('public/'):
        possible_paths.append(os.path.join(site_path, file_path))
    elif file_path.startswith('private/'):
        possible_paths.append(os.path.join(site_path, file_path))
    elif file_path.startswith('files/'):
        possible_paths.append(os.path.join(site_path, 'public', file_path))
        possible_paths.append(os.path.join(site_path, 'private', file_path))
    else:
        # Try both public and private directories for the filename
        possible_paths.append(os.path.join(site_path, 'public', 'files', file_path))
        possible_paths.append(os.path.join(site_path, 'private', 'files', file_path))
    
    # Find the first existing file
    full_path = None
    for path in possible_paths:
        print(f"   Checking path: '{path}'")
        if os.path.exists(path):
            full_path = path
            print(f"   ✅ Found file at: '{full_path}'")
            break
    
    # If no file found in any location
    if not full_path:
        print(f"   ❌ FILE NOT FOUND in any of these locations:")
        for path in possible_paths:
            print(f"      - {path}")
        
        # List available video files for debugging
        try:
            import glob
            print(f"   📁 Available video files in public/files:")
            public_files = glob.glob(os.path.join(site_path, 'public', 'files', "*.mp4"))
            for f in public_files[:5]:
                print(f"      - {os.path.basename(f)}")
            if len(public_files) > 5:
                print(f"      ... and {len(public_files) - 5} more files")
                
            print(f"   📁 Available video files in private/files:")
            private_files = glob.glob(os.path.join(site_path, 'private', 'files', "*.mp4"))
            for f in private_files[:5]:
                print(f"      - {os.path.basename(f)}")
            if len(private_files) > 5:
                print(f"      ... and {len(private_files) - 5} more files")
        except Exception as e:
            print(f"   ⚠️ Could not list directories: {e}")
        
        frappe.logger().error(f"File not found in any location: {possible_paths}")
        
        # Return proper 404 response instead of throwing exception
        frappe.local.response.http_status_code = 404
        frappe.local.response['type'] = 'json'
        return {
            "error": "Video file not found",
            "message": f"The requested video file '{file_path}' does not exist on the server.",
            "requested_file": file_path,
            "searched_paths": possible_paths
        }
    else:
        print(f"   ✅ File exists, size: {os.path.getsize(full_path)} bytes")
    
    # Get file info
    file_size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
    
    frappe.logger().info(f"Serving video: {full_path}, size: {file_size}, type: {content_type}")
    
    # Handle range requests for video seeking
    range_header = frappe.request.headers.get('Range')
    frappe.logger().info(f"Range header: {range_header}")
    
    if range_header:
        # Parse range header
        ranges = range_header.replace('bytes=', '').split('-')
        start = int(ranges[0]) if ranges[0] else 0
        end = int(ranges[1]) if ranges[1] else file_size - 1
        
        # Ensure valid range
        if start >= file_size or end >= file_size:
            frappe.local.response.status_code = 416
            return
        
        content_length = end - start + 1
        
        # Read file chunk
        with open(full_path, 'rb') as f:
            f.seek(start)
            data = f.read(content_length)
        
        # Create partial content response
        response = Response(
            data,
            206,
            headers={
                'Content-Range': f'bytes {start}-{end}/{file_size}',
                'Accept-Ranges': 'bytes',
                'Content-Length': str(content_length),
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Range',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range',
            }
        )
        frappe.logger().info(f"Serving range {start}-{end}/{file_size}")
        return response
    
    else:
        # Serve entire file
        with open(full_path, 'rb') as f:
            data = f.read()
        
        response = Response(
            data,
            200,
            headers={
                'Accept-Ranges': 'bytes',
                'Content-Length': str(file_size),
                'Content-Type': content_type,
                'Cache-Control': 'max-age=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Range',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Length, Content-Range',
            }
        )
        return response


@frappe.whitelist(allow_guest=True)
def serve_video(filename):
    """
    API endpoint to serve video files with range request support
    """
    print(f"🎬 SERVE_VIDEO API CALLED:")
    print(f"   Raw filename parameter: '{filename}'")
    print(f"   Type: {type(filename)}")
    
    if not filename:
        print(f"   ❌ No filename provided")
        frappe.throw("No filename provided")
    
    # Clean and validate the filename
    filename = cstr(filename).strip()
    print(f"   Cleaned filename: '{filename}'")
    
    # Security check - prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        print(f"   ❌ Invalid filename detected: '{filename}'")
        frappe.throw("Invalid filename")
    
    # Call the helper function to serve the file
    try:
        result = _serve_video_file(filename)
        print(f"   ✅ File served successfully")
        return result
    except Exception as e:
        print(f"   ❌ Error serving file: {e}")
        frappe.logger().error(f"Error serving video {filename}: {str(e)}")
        frappe.throw(f"Error serving video: {str(e)}")


@frappe.whitelist(allow_guest=True) 
def serve_video_file(file_path):
    """
    Alternative API endpoint for serving video files
    """
    print(f"🎬 SERVE_VIDEO_FILE API CALLED:")
    print(f"   Raw file_path parameter: '{file_path}'")
    
    if not file_path:
        frappe.throw("No file path provided")
    
    # Clean the file path
    file_path = cstr(file_path).strip()
    print(f"   Cleaned file_path: '{file_path}'")
    
    # Security check - prevent directory traversal
    if '..' in file_path:
        frappe.throw("Invalid file path")
    
    # Call the helper function to serve the file
    try:
        result = _serve_video_file(file_path)
        print(f"   ✅ File served successfully via serve_video_file")
        return result
    except Exception as e:
        print(f"   ❌ Error serving file via serve_video_file: {e}")
        frappe.logger().error(f"Error serving video file {file_path}: {str(e)}")
        frappe.throw(f"Error serving video file: {str(e)}") 