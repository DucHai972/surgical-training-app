import frappe
import os
from frappe.utils import cstr
from werkzeug.wrappers import Response
import mimetypes

@frappe.whitelist(allow_guest=True)
def serve_video_file(file_path):
    """
    Serve video files with range request support for seeking functionality
    """
    if not file_path:
        frappe.throw("File path is required")
    
    # Security check - ensure the file path is safe
    if '..' in file_path or file_path.startswith('/'):
        frappe.throw("Invalid file path")
    
    # Build the full file path
    site_path = frappe.utils.get_site_path()
    if file_path.startswith('private/'):
        full_path = os.path.join(site_path, file_path)
    else:
        full_path = os.path.join(site_path, 'private', file_path)
    
    # Check if file exists
    if not os.path.exists(full_path):
        frappe.throw("File not found", frappe.DoesNotExistError)
    
    # Get file info
    file_size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
    
    # Handle range requests for video seeking
    range_header = frappe.request.headers.get('Range')
    
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
            }
        )
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
            }
        )
        return response 