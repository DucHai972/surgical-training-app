import frappe
from frappe import _
from frappe.utils import now

@frappe.whitelist()
def get_doctor_sessions(status_filter=None):
    """Get sessions assigned to the current doctor with their status"""
    user = frappe.session.user
    
    # Check if user has Physician role
    if "Physician" not in frappe.get_roles(user):
        frappe.throw(_("Only physicians can access this data"))
    
    try:
        # Base filters for sessions assigned to this doctor
        filters = {"assigned_user": user}
        
        # Add status filter if provided
        if status_filter and status_filter != "All":
            filters["doctor_status"] = status_filter
        
        # Get session assignments with details
        assignments = frappe.get_all(
            "Session Assignment",
            filters=filters,
            fields=[
                "name", "session", "doctor_status", "started_at", "completed_at",
                "progress_notes", "total_comments", "assignment_date"
            ],
            order_by="assignment_date desc"
        )
        
        # Enrich with session details
        for assignment in assignments:
            session_doc = frappe.get_doc("Session", assignment.session)
            assignment.update({
                "session_title": session_doc.title,
                "session_description": session_doc.description,
                "session_date": session_doc.session_date,
                "session_status": session_doc.status,
                "video_count": len(session_doc.videos) if session_doc.videos else 0
            })
            
            # Format timestamps
            for field in ["started_at", "completed_at", "assignment_date", "session_date"]:
                if assignment.get(field):
                    assignment[field] = str(assignment[field])
        
        return {
            "sessions": assignments,
            "total_count": len(assignments)
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting doctor sessions: {str(e)}")
        frappe.throw(_("Failed to get session data"))

@frappe.whitelist()
def update_session_status(assignment_id, status, progress_notes=None):
    """Update the status of a session assignment for the current doctor"""
    user = frappe.session.user
    
    # Check if user has Physician role
    if "Physician" not in frappe.get_roles(user):
        frappe.throw(_("Only physicians can update session status"))
    
    try:
        # Get the assignment
        assignment = frappe.get_doc("Session Assignment", assignment_id)
        
        # Security check - doctor can only update their own assignments
        if assignment.assigned_user != user:
            frappe.throw(_("You can only update your own session status"))
        
        # Validate status
        valid_statuses = ["Not Started", "In Progress", "Completed"]
        if status not in valid_statuses:
            frappe.throw(_("Invalid status. Must be one of: {}").format(", ".join(valid_statuses)))
        
        # Update status and notes
        assignment.doctor_status = status
        if progress_notes is not None:
            assignment.progress_notes = progress_notes
        
        # The timestamps will be automatically set by the validate method
        assignment.save()
        frappe.db.commit()
        
        return {
            "status": "success",
            "message": f"Session status updated to '{status}'",
            "assignment": {
                "name": assignment.name,
                "doctor_status": assignment.doctor_status,
                "started_at": str(assignment.started_at) if assignment.started_at else None,
                "completed_at": str(assignment.completed_at) if assignment.completed_at else None,
                "progress_notes": assignment.progress_notes,
                "total_comments": assignment.total_comments
            }
        }
        
    except frappe.DoesNotExistError:
        frappe.throw(_("Session assignment not found"))
    except Exception as e:
        frappe.log_error(f"Error updating session status: {str(e)}")
        frappe.throw(_("Failed to update session status"))

@frappe.whitelist()
def get_session_history():
    """Get complete session history for the current doctor"""
    user = frappe.session.user
    
    # Check if user has Physician role
    if "Physician" not in frappe.get_roles(user):
        frappe.throw(_("Only physicians can access this data"))
    
    try:
        # Get all completed sessions for this doctor
        assignments = frappe.get_all(
            "Session Assignment",
            filters={
                "assigned_user": user,
                "doctor_status": "Completed"
            },
            fields=[
                "name", "session", "doctor_status", "started_at", "completed_at",
                "progress_notes", "total_comments", "assignment_date"
            ],
            order_by="completed_at desc"
        )
        
        # Enrich with session details and comments
        for assignment in assignments:
            session_doc = frappe.get_doc("Session", assignment.session)
            assignment.update({
                "session_title": session_doc.title,
                "session_description": session_doc.description,
                "session_date": session_doc.session_date,
                "video_count": len(session_doc.videos) if session_doc.videos else 0
            })
            
            # Get comments made by this doctor on this session
            comments = frappe.get_all(
                "Video Comment",
                filters={
                    "session": assignment.session,
                    "doctor": user
                },
                fields=[
                    "name", "video_title", "timestamp", "comment_text", 
                    "comment_type", "created_at"
                ],
                order_by="created_at asc"
            )
            
            assignment["comments"] = comments
            
            # Format timestamps
            for field in ["started_at", "completed_at", "assignment_date", "session_date"]:
                if assignment.get(field):
                    assignment[field] = str(assignment[field])
            
            # Format comment timestamps
            for comment in comments:
                if comment.get("created_at"):
                    comment["created_at"] = str(comment["created_at"])
        
        # Calculate summary statistics
        total_sessions = len(assignments)
        total_comments = sum(assignment.get("total_comments", 0) for assignment in assignments)
        
        return {
            "history": assignments,
            "summary": {
                "total_completed_sessions": total_sessions,
                "total_comments": total_comments,
                "average_comments_per_session": round(total_comments / total_sessions, 1) if total_sessions > 0 else 0
            }
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting session history: {str(e)}")
        frappe.throw(_("Failed to get session history"))

@frappe.whitelist()
def get_session_comments(session_id):
    """Get all comments made by the current doctor on a specific session"""
    user = frappe.session.user
    
    # Check if user has Physician role
    if "Physician" not in frappe.get_roles(user):
        frappe.throw(_("Only physicians can access this data"))
    
    try:
        # Get session assignment to verify access
        assignment = frappe.get_value(
            "Session Assignment",
            {"session": session_id, "assigned_user": user},
            ["name", "doctor_status", "session"],
            as_dict=True
        )
        
        if not assignment:
            frappe.throw(_("You don't have access to this session"))
        
        # Get all comments by this doctor on this session
        comments = frappe.get_all(
            "Video Comment",
            filters={
                "session": session_id,
                "doctor": user
            },
            fields=[
                "name", "video_title", "timestamp", "duration", "comment_text",
                "comment_type", "created_at", "modified"
            ],
            order_by="video_title asc, timestamp asc"
        )
        
        # Format timestamps
        for comment in comments:
            for field in ["created_at", "modified"]:
                if comment.get(field):
                    comment[field] = str(comment[field])
        
        # Group comments by video
        videos = {}
        for comment in comments:
            video_title = comment["video_title"]
            if video_title not in videos:
                videos[video_title] = []
            videos[video_title].append(comment)
        
        return {
            "session_id": session_id,
            "assignment_status": assignment.doctor_status,
            "comments_by_video": videos,
            "total_comments": len(comments)
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting session comments: {str(e)}")
        frappe.throw(_("Failed to get session comments"))

@frappe.whitelist()
def get_doctor_dashboard_stats():
    """Get dashboard statistics for the current doctor"""
    user = frappe.session.user
    
    # Check if user has Physician role
    if "Physician" not in frappe.get_roles(user):
        frappe.throw(_("Only physicians can access this data"))
    
    try:
        # Get assignment counts by status
        stats = {}
        for status in ["Not Started", "In Progress", "Completed"]:
            count = frappe.db.count("Session Assignment", {
                "assigned_user": user,
                "doctor_status": status
            })
            stats[status.lower().replace(" ", "_")] = count
        
        # Get total comments
        total_comments = frappe.db.count("Video Comment", {"doctor": user})
        
        # Get recent activity (last 7 days)
        recent_comments = frappe.db.count("Video Comment", {
            "doctor": user,
            "created_at": [">=", frappe.utils.add_days(now(), -7)]
        })
        
        # Get sessions completed this month
        current_month_start = frappe.utils.get_first_day(now())
        completed_this_month = frappe.db.count("Session Assignment", {
            "assigned_user": user,
            "doctor_status": "Completed",
            "completed_at": [">=", current_month_start]
        })
        
        return {
            "session_counts": stats,
            "total_comments": total_comments,
            "recent_comments": recent_comments,
            "completed_this_month": completed_this_month,
            "total_assigned": sum(stats.values())
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting dashboard stats: {str(e)}")
        frappe.throw(_("Failed to get dashboard statistics"))