import frappe
from frappe import _
from frappe.utils import cint, flt

@frappe.whitelist()
def add_comment(session, video_title, timestamp, comment_text):
    """Add a new comment to a video"""
    if not frappe.session.user:
        return {"message": "Error", "error": "User not authenticated"}
    
    try:
        # Check if user is admin or has Physician role
        user_roles = frappe.get_roles(frappe.session.user)
        is_admin = "Administrator" in user_roles
        is_physician = "Physician" in user_roles
        
        doctor_name = None
        
        # If user is not admin or physician, check if they are linked to a Doctor
        if not (is_admin or is_physician):
            doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
            if not doctors:
                return {"message": "Error", "error": "User is not registered as a doctor, administrator, or physician"}
            doctor_name = doctors[0].name
        else:
            # For admin/physician users without a Doctor record, create a placeholder
            user_full_name = frappe.db.get_value("User", frappe.session.user, "full_name")
            
            # Check if this user already has a Doctor record
            doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
            if doctors:
                doctor_name = doctors[0].name
            else:
                # Create a temporary Doctor record for this comment
                temp_doctor = frappe.new_doc("Doctor")
                temp_doctor.full_name = user_full_name or frappe.session.user
                temp_doctor.user = frappe.session.user
                temp_doctor.insert(ignore_permissions=True)
                doctor_name = temp_doctor.name
        
        # Validate timestamp is a valid number
        timestamp = flt(timestamp)
        if timestamp < 0:
            return {"message": "Error", "error": "Timestamp must be a positive number"}
        
        # Create a new comment
        comment = frappe.new_doc("Video Comment")
        comment.doctor = doctor_name
        comment.session = session
        comment.video_title = video_title
        comment.timestamp = timestamp
        comment.comment_text = comment_text
        comment.insert()
        
        # Convert created_at to string for proper JSON serialization
        created_at = str(comment.created_at) if comment.created_at else ""
        
        return {
            "message": "Success",
            "data": {
                "name": comment.name,
                "doctor": comment.doctor,
                "session": comment.session,
                "video_title": comment.video_title,
                "timestamp": comment.timestamp,
                "comment_text": comment.comment_text,
                "created_at": created_at
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error adding comment: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def get_comments_by_video(session, video_title):
    """Get comments for a specific video"""
    try:
        comments = frappe.get_list(
            "Video Comment",
            filters={"session": session, "video_title": video_title},
            fields=["name", "doctor", "timestamp", "comment_text", "created_at"],
            order_by="timestamp asc"
        )
        
        # Include doctor's name and convert created_at to string
        for comment in comments:
            doctor_doc = frappe.get_doc("Doctor", comment.doctor)
            comment["doctor_name"] = doctor_doc.full_name
            if comment.get("created_at"):
                comment["created_at"] = str(comment["created_at"])
        
        return {"message": "Success", "data": comments}
    except Exception as e:
        frappe.log_error(f"Error getting comments: {str(e)}")
        return {"message": "Error", "error": str(e)} 