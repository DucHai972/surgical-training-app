import frappe
from frappe import _
from frappe.utils import get_datetime, format_datetime, now_datetime, getdate
import json

@frappe.whitelist()
def get_user_activity_history(limit=None):
	"""Get current user's activity history including comments, sessions, and other activities"""
	user = frappe.session.user
	
	# Convert limit to integer (handles both string and int inputs)
	# If no limit specified, get all activities
	if limit is not None:
		try:
			limit = int(limit)
		except (ValueError, TypeError):
			limit = None
	
	try:
		activities = []
		
		# Get user's comments on videos
		# Handle potential user format mismatch (e.g., admin-administrator@gmail.com vs administrator@gmail.com)
		user_variations = [user]
		if "@" in user and not user.startswith("admin-"):
			user_variations.append(f"admin-{user}")
		elif user.startswith("admin-"):
			user_variations.append(user.replace("admin-", "", 1))
		
		# Debug logging
		print(f"🔍 User Activity Debug - User: {user}, Variations: {user_variations}")
		
		
		comments = frappe.get_all(
			"Video Comment",
			filters={
				"doctor": ["in", user_variations],
				"docstatus": ["!=", 2]
			},
			fields=[
				"name", "comment_text", "timestamp", "video_title", 
				"creation", "modified", "session"
			],
			order_by="creation desc"
		)
		
		print(f"🔍 Found {len(comments)} comments")
		
		for comment in comments:
			activities.append({
				"type": "comment",
				"title": f"Commented on video: {comment.video_title or 'Unknown Video'}",
				"description": comment.comment_text[:100] + ("..." if len(comment.comment_text) > 100 else ""),
				"timestamp": comment.creation,
				"session": comment.session,
				"details": {
					"video_title": comment.video_title,
					"video_timestamp": comment.timestamp,
					"full_comment": comment.comment_text
				}
			})
		
		# Get user's session assignments - try direct user match first
		assignments = frappe.get_all(
			"Session Assignment",
			filters={
				"assigned_user": user,
				"docstatus": ["!=", 2]
			},
			fields=[
				"name", "session", "assignment_date", "doctor_status", 
				"assigned_by", "creation", "modified"
			],
			order_by="creation desc"
		)
		
		print(f"🔍 Found {len(assignments)} session assignments with direct user match")
		
		# If no assignments found with direct match, try user variations
		if not assignments:
			assignments = frappe.get_all(
				"Session Assignment",
				filters={
					"assigned_user": ["in", user_variations],
					"docstatus": ["!=", 2]
				},
				fields=[
					"name", "session", "assignment_date", "doctor_status", 
					"assigned_by", "creation", "modified"
				],
				order_by="creation desc"
			)
			print(f"🔍 Found {len(assignments)} session assignments with user variations")
		
		for assignment in assignments:
			# Get session details
			session_doc = frappe.get_doc("Session", assignment.session)
			activities.append({
				"type": "session_assignment",
				"title": f"Assigned to session: {session_doc.title}",
				"description": f"Status: {assignment.doctor_status or 'Pending'}",
				"timestamp": assignment.assignment_date or assignment.creation,
				"session": assignment.session,
				"details": {
					"session_title": session_doc.title,
					"session_description": session_doc.description,
					"assigned_by": assignment.assigned_by,
					"status": assignment.doctor_status
				}
			})
		
		# If no session assignments found, create session activities from sessions user has worked on (via comments)
		if not assignments:
			# Group comments by session to get activity details
			sessions_from_comments = set([c.session for c in comments if c.session])
			print(f"🔍 Sessions found from comments: {list(sessions_from_comments)}")
			
			for session_name in sessions_from_comments:
				try:
					session_doc = frappe.get_doc("Session", session_name)
					# Get all comments for this session
					session_comments = [c for c in comments if c.session == session_name]
					
					# Get first and last comment times
					earliest_comment = min(session_comments, key=lambda x: x.creation)
					latest_comment = max(session_comments, key=lambda x: x.creation)
					comment_count = len(session_comments)
					
					# Create description based on comment activity
					if comment_count == 1:
						description = f"Left {comment_count} comment on training videos"
					else:
						description = f"Left {comment_count} comments on training videos"
					
					# Use the latest comment time as the activity timestamp (more recent activity)
					activities.append({
						"type": "session_assignment", 
						"title": f"Participated in session: {session_doc.title}",
						"description": description,
						"timestamp": latest_comment.creation,
						"session": session_name,
						"details": {
							"session_title": session_doc.title,
							"session_description": session_doc.description,
							"comment_count": comment_count,
							"first_activity": earliest_comment.creation,
							"latest_activity": latest_comment.creation,
							"status": "Active Participant"
						}
					})
				except Exception as e:
					print(f"🔍 Error getting session {session_name}: {e}")
					continue
		
		# Evaluations removed from activity history as requested
		
		# Get recent login activity (from User table)
		user_doc = frappe.get_doc("User", user)
		if user_doc.last_login:
			activities.append({
				"type": "login",
				"title": "Logged in",
				"description": "Accessed the surgical training platform",
				"timestamp": user_doc.last_login,
				"session": None,
				"details": {
					"login_time": user_doc.last_login
				}
			})
		
		print(f"🔍 Total activities before sorting: {len(activities)}")
		print(f"🔍 Activities by type: {[(a['type'], a['title'][:50]) for a in activities[:5]]}")
		
		# Sort all activities by timestamp (most recent first)
		activities.sort(key=lambda x: get_datetime(x["timestamp"]), reverse=True)
		
		# Get summary statistics from ALL activities before limiting
		all_activities_stats = {
			"total_comments": len([a for a in activities if a["type"] == "comment"]),
			"total_sessions": len(set([a["session"] for a in activities if a["session"]])),
			"total_evaluations": len([a for a in activities if a["type"] == "evaluation"]),
			"last_activity": activities[0]["timestamp"] if activities else None
		}
		
		print(f"🔍 Stats calculated: {all_activities_stats}")
		
		# Only limit activities if a specific limit was requested
		if limit is not None:
			activities = activities[:limit]
		
		# Format timestamps for display
		for activity in activities:
			activity["formatted_time"] = format_datetime(activity["timestamp"], format_string="MMM dd, yyyy 'at' hh:mm a")
			activity["relative_time"] = get_relative_time(activity["timestamp"])
		
		# Use the comprehensive stats from all activities
		stats = all_activities_stats
		
		return {
			"status": "success",
			"activities": activities,
			"stats": stats,
			"user": user
		}
		
	except Exception as e:
		frappe.log_error(f"Error getting user activity history: {str(e)}")
		return {
			"status": "error",
			"message": _("Failed to get activity history"),
			"error": str(e)
		}

def get_relative_time(timestamp):
	"""Get relative time string like '2 hours ago'"""
	try:
		now = now_datetime()
		dt = get_datetime(timestamp)
		diff = now - dt
		
		if diff.days > 0:
			if diff.days == 1:
				return "1 day ago"
			elif diff.days < 7:
				return f"{diff.days} days ago"
			elif diff.days < 30:
				weeks = diff.days // 7
				return f"{weeks} week{'s' if weeks > 1 else ''} ago"
			else:
				months = diff.days // 30
				return f"{months} month{'s' if months > 1 else ''} ago"
		
		hours = diff.seconds // 3600
		if hours > 0:
			return f"{hours} hour{'s' if hours > 1 else ''} ago"
		
		minutes = diff.seconds // 60
		if minutes > 0:
			return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
		
		return "Just now"
		
	except:
		return "Recently"

@frappe.whitelist()
def get_user_activity_stats():
	"""Get summary statistics for user's activity"""
	user = frappe.session.user
	
	try:
		# Handle potential user format mismatch
		user_variations = [user]
		if "@" in user and not user.startswith("admin-"):
			user_variations.append(f"admin-{user}")
		elif user.startswith("admin-"):
			user_variations.append(user.replace("admin-", "", 1))
		
		stats = {}
		
		# Count total comments
		stats["total_comments"] = frappe.db.count("Video Comment", {
			"doctor": ["in", user_variations],
			"docstatus": ["!=", 2]
		})
		
		# Count total sessions assigned
		stats["total_sessions"] = frappe.db.count("Session Assignment", {
			"assigned_user": ["in", user_variations],
			"docstatus": ["!=", 2]
		})
		
		# Count completed evaluations
		if frappe.db.exists("DocType", "Session Evaluation"):
			stats["completed_evaluations"] = frappe.db.count("Session Evaluation", {
				"doctor": ["in", user_variations],
				"docstatus": ["!=", 2]
			})
		else:
			stats["completed_evaluations"] = 0
		
		# Get most recent activity
		recent_comment = frappe.get_all(
			"Video Comment",
			filters={"doctor": ["in", user_variations], "docstatus": ["!=", 2]},
			fields=["creation"],
			order_by="creation desc",
			limit=1
		)
		
		stats["last_activity"] = recent_comment[0].creation if recent_comment else None
		
		# Calculate activity this week
		week_ago = frappe.utils.add_days(frappe.utils.nowdate(), -7)
		stats["comments_this_week"] = frappe.db.count("Video Comment", {
			"doctor": ["in", user_variations],
			"creation": [">=", week_ago],
			"docstatus": ["!=", 2]
		})
		
		return {
			"status": "success",
			"stats": stats
		}
		
	except Exception as e:
		frappe.log_error(f"Error getting user activity stats: {str(e)}")
		return {
			"status": "error",
			"message": _("Failed to get activity statistics")
		}