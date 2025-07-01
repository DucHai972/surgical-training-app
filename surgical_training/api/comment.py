import frappe
from frappe import _
from frappe.utils import cint, flt, now

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
        comment.created_at = now()
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

@frappe.whitelist()
def delete_comment(comment_name):
    """Delete a comment - users can only delete their own comments, admins can delete any comment"""
    if not frappe.session.user:
        return {"message": "Error", "error": "User not authenticated"}
    
    try:
        # Get the comment document
        comment = frappe.get_doc("Video Comment", comment_name)
        
        # Check user permissions
        user_roles = frappe.get_roles(frappe.session.user)
        is_admin = "Administrator" in user_roles
        
        # Get current user's doctor record if exists
        current_user_doctor = None
        doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
        if doctors:
            current_user_doctor = doctors[0].name
        
        # Check if user can delete this comment
        can_delete = False
        
        if is_admin:
            # Admins can delete any comment
            can_delete = True
        elif current_user_doctor and comment.doctor == current_user_doctor:
            # Users can delete their own comments
            can_delete = True
        
        if not can_delete:
            return {"message": "Error", "error": "You don't have permission to delete this comment"}
        
        # Delete the comment
        comment.delete()
        
        return {
            "message": "Success",
            "data": {
                "deleted_comment": comment_name
            }
        }
        
    except frappe.DoesNotExistError:
        return {"message": "Error", "error": "Comment not found"}
    except Exception as e:
        frappe.log_error(f"Error deleting comment: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def update_comment(comment_name, comment_text):
    """Update a comment - users can only update their own comments, admins can update any comment"""
    if not frappe.session.user:
        return {"message": "Error", "error": "User not authenticated"}
    
    try:
        # Get the comment document
        comment = frappe.get_doc("Video Comment", comment_name)
        
        # Check user permissions
        user_roles = frappe.get_roles(frappe.session.user)
        is_admin = "Administrator" in user_roles
        
        # Get current user's doctor record if exists
        current_user_doctor = None
        doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
        if doctors:
            current_user_doctor = doctors[0].name
        
        # Check if user can update this comment
        can_update = False
        
        if is_admin:
            # Admins can update any comment
            can_update = True
        elif current_user_doctor and comment.doctor == current_user_doctor:
            # Users can update their own comments
            can_update = True
        
        if not can_update:
            return {"message": "Error", "error": "You don't have permission to update this comment"}
        
        # Update the comment text
        comment.comment_text = comment_text
        comment.save()
        
        # Get doctor name for response
        doctor_doc = frappe.get_doc("Doctor", comment.doctor)
        doctor_name = doctor_doc.full_name
        
        return {
            "message": "Success",
            "data": {
                "name": comment.name,
                "doctor": comment.doctor,
                "doctor_name": doctor_name,
                "session": comment.session,
                "video_title": comment.video_title,
                "timestamp": comment.timestamp,
                "comment_text": comment.comment_text,
                "created_at": str(comment.created_at) if comment.created_at else ""
            }
        }
        
    except frappe.DoesNotExistError:
        return {"message": "Error", "error": "Comment not found"}
    except Exception as e:
        frappe.log_error(f"Error updating comment: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def can_edit_comment(comment_name):
    """Check if current user can edit a specific comment"""
    if not frappe.session.user:
        return {"message": "Error", "error": "User not authenticated"}
    
    try:
        # Get the comment document
        comment = frappe.get_doc("Video Comment", comment_name)
        
        # Check user permissions
        user_roles = frappe.get_roles(frappe.session.user)
        is_admin = "Administrator" in user_roles
        
        # Get current user's doctor record if exists
        current_user_doctor = None
        doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
        if doctors:
            current_user_doctor = doctors[0].name
        
        # Check if user can edit this comment
        can_edit = False
        
        if is_admin:
            # Admins can edit any comment
            can_edit = True
        elif current_user_doctor and comment.doctor == current_user_doctor:
            # Users can edit their own comments
            can_edit = True
        
        return {
            "message": "Success",
            "data": {
                "can_edit": can_edit,
                "is_admin": is_admin,
                "is_own_comment": current_user_doctor == comment.doctor if current_user_doctor else False
            }
        }
        
    except frappe.DoesNotExistError:
        return {"message": "Error", "error": "Comment not found"}
    except Exception as e:
        frappe.log_error(f"Error checking edit permission: {str(e)}")
        return {"message": "Error", "error": str(e)}

@frappe.whitelist()
def can_delete_comment(comment_name):
    """Check if current user can delete a specific comment"""
    if not frappe.session.user:
        return {"message": "Error", "error": "User not authenticated"}
    
    try:
        # Get the comment document
        comment = frappe.get_doc("Video Comment", comment_name)
        
        # Check user permissions
        user_roles = frappe.get_roles(frappe.session.user)
        is_admin = "Administrator" in user_roles
        
        # Get current user's doctor record if exists
        current_user_doctor = None
        doctors = frappe.get_list("Doctor", filters={"user": frappe.session.user})
        if doctors:
            current_user_doctor = doctors[0].name
        
        # Check if user can delete this comment
        can_delete = False
        
        if is_admin:
            # Admins can delete any comment
            can_delete = True
        elif current_user_doctor and comment.doctor == current_user_doctor:
            # Users can delete their own comments
            can_delete = True
        
        return {
            "message": "Success",
            "data": {
                "can_delete": can_delete,
                "is_admin": is_admin,
                "is_own_comment": current_user_doctor == comment.doctor if current_user_doctor else False
            }
        }
        
    except frappe.DoesNotExistError:
        return {"message": "Error", "error": "Comment not found"}
    except Exception as e:
        frappe.log_error(f"Error checking delete permission: {str(e)}")
        return {"message": "Error", "error": str(e)}

# Custom Template Management

@frappe.whitelist()
def get_custom_templates():
    """Get all custom comment templates for the current user"""
    try:
        # Check if user is authenticated
        if not frappe.session.user or frappe.session.user == "Guest":
            return []
        
        templates = frappe.get_all(
            "Comment Template",
            filters={"owner": frappe.session.user},
            fields=["name", "title", "content", "color", "emoji", "creation", "modified"],
            order_by="creation desc"
        )
        return templates
    except Exception as e:
        frappe.log_error(f"Error getting custom templates: {str(e)}")
        return []

@frappe.whitelist()
def create_custom_template(title, content, color="blue", emoji="💬"):
    """Create a new custom comment template"""
    try:
        # Check if user is authenticated
        if not frappe.session.user or frappe.session.user == "Guest":
            frappe.throw(_("Authentication required"))
        
        template = frappe.get_doc({
            "doctype": "Comment Template",
            "title": title,
            "content": content,
            "color": color,
            "emoji": emoji,
            "owner": frappe.session.user
        })
        template.insert()
        
        return {
            "name": template.name,
            "title": template.title,
            "content": template.content,
            "color": template.color,
            "emoji": template.emoji,
            "created": str(template.creation),
            "modified": str(template.modified)
        }
    except Exception as e:
        frappe.log_error(f"Error creating custom template: {str(e)}")
        frappe.throw(_("Failed to create template"))

@frappe.whitelist()
def update_custom_template(template_name, title, content, color="blue", emoji="💬"):
    """Update a custom comment template"""
    try:
        template = frappe.get_doc("Comment Template", template_name)
        
        # Check permissions
        if template.owner != frappe.session.user and not frappe.session.user == "Administrator":
            frappe.throw(_("You can only edit your own templates"))
        
        template.title = title
        template.content = content
        template.color = color
        template.emoji = emoji
        template.save()
        
        return {
            "name": template.name,
            "title": template.title,
            "content": template.content,
            "color": template.color,
            "emoji": template.emoji,
            "created": str(template.creation),
            "modified": str(template.modified)
        }
    except Exception as e:
        frappe.log_error(f"Error updating custom template: {str(e)}")
        frappe.throw(_("Failed to update template"))

@frappe.whitelist()
def delete_custom_template(template_name):
    """Delete a custom comment template"""
    try:
        template = frappe.get_doc("Comment Template", template_name)
        
        # Check permissions
        if template.owner != frappe.session.user and not frappe.session.user == "Administrator":
            frappe.throw(_("You can only delete your own templates"))
        
        template.delete()
        return {"success": True}
    except Exception as e:
        frappe.log_error(f"Error deleting custom template: {str(e)}")
        frappe.throw(_("Failed to delete template")) 