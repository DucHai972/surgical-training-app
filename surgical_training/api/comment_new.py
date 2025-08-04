import frappe
from frappe import _
from frappe.utils import cint, flt, now

@frappe.whitelist()
def add_comment(session, video_title, timestamp, comment_text, duration=None, comment_type=None):
    """Add a new comment to a video with proper role-based security"""
    try:
        # Validate user is authenticated
        if not frappe.session.user or frappe.session.user == "Guest":
            frappe.throw(_("Authentication required"))
        
        # Check if user has permission to create comments
        user_roles = frappe.get_roles(frappe.session.user)
        if not ("System Manager" in user_roles or "Physician" in user_roles):
            frappe.throw(_("You don't have permission to create comments"))
        
        # Validate and process parameters
        timestamp = flt(timestamp)
        if timestamp < 0:
            frappe.throw(_("Timestamp must be a positive number"))
        
        duration = cint(duration) if duration is not None else 30
        if duration < 1 or duration > 600:
            duration = 30
        
        valid_types = ["neutral", "positive", "warning", "critical"]
        comment_type = comment_type if comment_type in valid_types else "neutral"
        
        # Create comment - DocType validation will handle security
        comment = frappe.get_doc({
            "doctype": "Video Comment",
            "doctor": frappe.session.user,  # Will be auto-set by DocType
            "session": session,
            "video_title": video_title,
            "timestamp": timestamp,
            "duration": duration,
            "comment_type": comment_type,
            "comment_text": comment_text,
            "created_at": now()
        })
        
        comment.insert()
        frappe.db.commit()
        
        return {
            "status": "success",
            "data": {
                "name": comment.name,
                "doctor": comment.doctor,
                "session": comment.session,
                "video_title": comment.video_title,
                "timestamp": comment.timestamp,
                "duration": comment.duration,
                "comment_type": comment.comment_type,
                "comment_text": comment.comment_text,
                "created_at": str(comment.created_at)
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error adding comment: {str(e)}")
        frappe.throw(_("Failed to add comment: {0}").format(str(e)))

@frappe.whitelist()
def get_comments_by_video(session, video_title):
    """Get comments for a video with automatic role-based filtering"""
    try:
        # The permission_query_conditions hook will automatically filter results
        # System Managers see all comments, Physicians see only their own
        comments = frappe.get_all(
            "Video Comment",
            filters={
                "session": session,
                "video_title": video_title
            },
            fields=[
                "name", "doctor", "comment_text", "timestamp", 
                "duration", "comment_type", "created_at", "modified"
            ],
            order_by="timestamp asc"
        )
        
        # Add display names for doctors
        for comment in comments:
            comment["doctor_name"] = get_doctor_display_name(comment.doctor)
        
        return comments
        
    except Exception as e:
        frappe.log_error(f"Error fetching comments: {str(e)}")
        return []

@frappe.whitelist()
def update_comment(comment_name, comment_text=None, duration=None, comment_type=None):
    """Update a comment with automatic permission checking"""
    try:
        # Get the comment - permission checking happens automatically
        comment = frappe.get_doc("Video Comment", comment_name)
        
        # Update fields if provided
        if comment_text is not None:
            comment.comment_text = comment_text
        if duration is not None:
            comment.duration = cint(duration)
            if comment.duration < 1 or comment.duration > 600:
                comment.duration = 30
        if comment_type is not None:
            valid_types = ["neutral", "positive", "warning", "critical"]
            if comment_type in valid_types:
                comment.comment_type = comment_type
        
        comment.save()
        frappe.db.commit()
        
        return {
            "status": "success",
            "data": {
                "name": comment.name,
                "comment_text": comment.comment_text,
                "duration": comment.duration,
                "comment_type": comment.comment_type
            }
        }
        
    except frappe.PermissionError:
        frappe.throw(_("You don't have permission to update this comment"))
    except frappe.DoesNotExistError:
        frappe.throw(_("Comment not found"))
    except Exception as e:
        frappe.log_error(f"Error updating comment: {str(e)}")
        frappe.throw(_("Failed to update comment: {0}").format(str(e)))

@frappe.whitelist()
def delete_comment(comment_name):
    """Delete a comment with automatic permission checking"""
    try:
        # Get the comment - permission checking happens automatically
        comment = frappe.get_doc("Video Comment", comment_name)
        comment.delete()
        frappe.db.commit()
        
        return {
            "status": "success",
            "data": {
                "deleted": True,
                "comment_name": comment_name
            }
        }
        
    except frappe.PermissionError:
        frappe.throw(_("You don't have permission to delete this comment"))
    except frappe.DoesNotExistError:
        frappe.throw(_("Comment not found"))
    except Exception as e:
        frappe.log_error(f"Error deleting comment: {str(e)}")
        frappe.throw(_("Failed to delete comment: {0}").format(str(e)))

@frappe.whitelist()
def get_user_permissions():
    """Get current user's permissions for commenting"""
    try:
        user_roles = frappe.get_roles(frappe.session.user)
        
        return {
            "user": frappe.session.user,
            "roles": user_roles,
            "can_create_comments": "System Manager" in user_roles or "Physician" in user_roles,
            "is_admin": "System Manager" in user_roles,
            "is_physician": "Physician" in user_roles
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions: {str(e)}")
        return {
            "user": frappe.session.user,
            "roles": [],
            "can_create_comments": False,
            "is_admin": False,
            "is_physician": False
        }

def get_doctor_display_name(doctor_user):
    """Get display name for a doctor user"""
    try:
        # Try to get user's full name
        user_doc = frappe.get_doc("User", doctor_user)
        if user_doc.full_name:
            return user_doc.full_name
        
        # Fallback to email-based name
        return doctor_user.split('@')[0].replace('.', ' ').title()
        
    except Exception:
        return doctor_user

# Template management functions with proper security
@frappe.whitelist()
def get_comment_templates():
    """Get comment templates accessible to current user"""
    try:
        user_roles = frappe.get_roles(frappe.session.user)
        
        if "System Manager" in user_roles:
            # Admins can see all templates
            filters = {}
        elif "Physician" in user_roles:
            # Physicians can see their own templates and system templates
            filters = {
                "owner": ["in", [frappe.session.user, "Administrator"]]
            }
        else:
            # Others see only system templates
            filters = {"owner": "Administrator"}
        
        templates = frappe.get_all(
            "Comment Template",
            filters=filters,
            fields=["name", "title", "content", "color", "emoji", "owner"],
            order_by="title asc"
        )
        
        return templates
        
    except Exception as e:
        frappe.log_error(f"Error getting comment templates: {str(e)}")
        return []

@frappe.whitelist()
def create_comment_template(title, content, color="blue", emoji="💬"):
    """Create a new comment template"""
    try:
        user_roles = frappe.get_roles(frappe.session.user)
        
        if not ("System Manager" in user_roles or "Physician" in user_roles):
            frappe.throw(_("You don't have permission to create templates"))
        
        template = frappe.get_doc({
            "doctype": "Comment Template",
            "title": title,
            "content": content,
            "color": color,
            "emoji": emoji
        })
        
        template.insert()
        frappe.db.commit()
        
        return {
            "status": "success",
            "data": {
                "name": template.name,
                "title": template.title,
                "content": template.content,
                "color": template.color,
                "emoji": template.emoji
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error creating template: {str(e)}")
        frappe.throw(_("Failed to create template: {0}").format(str(e)))