import frappe
from frappe import _
from frappe.utils import get_fullname, cstr
import json


@frappe.whitelist()
def get_user_profile():
	"""Get current user profile information"""
	user = frappe.session.user
	print(f"🔍 DEBUG: get_user_profile called for session.user={user}")
	
	# Note: Users can only access their own profile (session.user)
	
	try:
		user_doc = frappe.get_doc("User", user)
		
		# Get user role profile - simplified
		role_profile = "User"
		if user_doc.role_profile_name:
			role_profile = user_doc.role_profile_name
		elif user_doc.roles:
			role_profile = user_doc.roles[0].role
		
		profile_data = {
			"name": user_doc.name,
			"email": user_doc.email,
			"first_name": user_doc.first_name or "",
			"last_name": user_doc.last_name or "",
			"full_name": user_doc.full_name or get_fullname(user),
			"phone": user_doc.phone or "",
			"gender": user_doc.gender or "",
			"language": user_doc.language or "en",
			"role_profile_name": role_profile,
			"enabled": user_doc.enabled,
			"time_zone": user_doc.time_zone or ""
		}
		
		return profile_data
		
	except frappe.DoesNotExistError:
		frappe.throw(_("User not found"))
	except Exception as e:
		frappe.log_error(f"Error getting user profile: {str(e)}")
		frappe.throw(_("Failed to get user profile"))


@frappe.whitelist()
def get_user_roles():
	"""Get current user's roles"""
	user = frappe.session.user
	
	try:
		user_doc = frappe.get_doc("User", user)
		roles = [role.role for role in user_doc.roles]
		
		# Debug logging
		print(f"🔍 get_user_roles Debug for {user}:")
		print(f"  - User doc found: {user_doc.name}")
		print(f"  - User roles count: {len(user_doc.roles)}")
		print(f"  - Raw roles: {[role.role for role in user_doc.roles]}")
		print(f"  - Enabled: {user_doc.enabled}")
		print(f"  - Role profile: {user_doc.role_profile_name}")
		
		# Also check using frappe.get_roles() as alternative
		frappe_roles = frappe.get_roles(user)
		print(f"  - frappe.get_roles(): {frappe_roles}")
		
		return {
			"user": user,
			"roles": roles,
			"frappe_roles": frappe_roles,  # Alternative roles method
			"role_profile_name": user_doc.role_profile_name,
			"debug_info": {
				"user_doc_name": user_doc.name,
				"roles_count": len(user_doc.roles),
				"enabled": user_doc.enabled
			}
		}
		
	except frappe.DoesNotExistError:
		print(f"❌ User not found: {user}")
		frappe.throw(_("User not found"))
	except Exception as e:
		print(f"❌ Error getting user roles for {user}: {str(e)}")
		frappe.log_error(f"Error getting user roles: {str(e)}")
		frappe.throw(_("Failed to get user roles"))


@frappe.whitelist()
def setup_role_administrator():
	"""Setup Role Administrator role and assign to administrator@gmail.com - Admin only"""
	user = frappe.session.user
	
	# Only allow System Manager to run this
	if "System Manager" not in frappe.get_roles(user):
		frappe.throw(_("Only System Manager can setup roles"))
	
	try:
		role_name = "Role Administrator"
		
		# Create role if it doesn't exist
		if not frappe.db.exists("Role", role_name):
			role_doc = frappe.get_doc({
				"doctype": "Role",
				"role_name": role_name,
				"disabled": 0,
				"desk_access": 1
			})
			role_doc.insert(ignore_permissions=True)
			frappe.db.commit()
		
		# Assign role to administrator@gmail.com
		user_email = "administrator@gmail.com"
		
		if frappe.db.exists("User", user_email):
			user_doc = frappe.get_doc("User", user_email)
			
			# Check if role is already assigned
			has_role = any(role.role == role_name for role in user_doc.roles)
			
			if not has_role:
				user_doc.append("roles", {
					"role": role_name
				})
				user_doc.save(ignore_permissions=True)
				frappe.db.commit()
		
		return {
			"status": "success",
			"message": f"Role Administrator role created and assigned to {user_email}"
		}
		
	except Exception as e:
		frappe.log_error(f"Error setting up Role Administrator: {str(e)}")
		frappe.throw(_("Failed to setup Role Administrator"))


@frappe.whitelist()
def update_user_profile():
	"""Update current user profile information"""
	user = frappe.session.user
	
	# Get form data
	form_data = frappe.local.form_dict
	print(f"🔄 DEBUG: update_user_profile called for {user} with data: {form_data}")
	
	try:
		user_doc = frappe.get_doc("User", user)
		
		# List of allowed fields for update
		allowed_fields = [
			'first_name', 'last_name', 'phone', 'mobile_no', 
			'location', 'bio', 'user_image', 'birth_date', 
			'gender', 'language', 'time_zone'
		]
		
		# Update only allowed fields
		updated_fields = []
		for field in allowed_fields:
			if field in form_data and form_data[field] is not None:
				old_value = getattr(user_doc, field, None)
				new_value = form_data[field]
				if old_value != new_value:
					setattr(user_doc, field, new_value)
					updated_fields.append(field)
		
		if updated_fields:
			user_doc.save(ignore_permissions=True)
			frappe.db.commit()
			print(f"✅ Profile updated for {user}, fields: {updated_fields}")
			
			return {
				"status": "success",
				"message": "Profile updated successfully",
				"updated_fields": updated_fields
			}
		else:
			return {
				"status": "success", 
				"message": "No changes to update"
			}
			
	except frappe.DoesNotExistError:
		print(f"❌ User not found: {user}")
		frappe.throw(_("User not found"))
	except Exception as e:
		print(f"❌ Error updating profile for {user}: {str(e)}")
		frappe.log_error(f"Error updating user profile: {str(e)}")
		frappe.throw(_("Failed to update user profile"))


@frappe.whitelist()
def change_password():
	"""Change current user password"""
	user = frappe.session.user
	
	# Get form data
	form_data = frappe.local.form_dict
	old_password = form_data.get('old_password')
	new_password = form_data.get('new_password')
	
	print(f"🔐 DEBUG: change_password called for {user}")
	
	if not old_password or not new_password:
		frappe.throw(_("Both old and new passwords are required"))
	
	try:
		from frappe.utils.password import check_password, update_password
		
		# Verify old password
		if not check_password(user, old_password):
			frappe.throw(_("Current password is incorrect"))
		
		# Validate new password
		if len(new_password) < 8:
			frappe.throw(_("New password must be at least 8 characters long"))
		
		# Update password
		update_password(user, new_password)
		frappe.db.commit()
		
		print(f"✅ Password changed for {user}")
		return {
			"status": "success",
			"message": "Password changed successfully"
		}
		
	except frappe.AuthenticationError:
		print(f"❌ Authentication failed for {user}")
		frappe.throw(_("Current password is incorrect"))
	except Exception as e:
		print(f"❌ Error changing password for {user}: {str(e)}")
		frappe.log_error(f"Error changing password: {str(e)}")
		frappe.throw(_("Failed to change password"))


@frappe.whitelist()
def get_user_preferences(user=None):
	"""Get user preferences/settings"""
	if not user:
		user = frappe.session.user
	
	# Security check
	if user != frappe.session.user and not frappe.has_permission("User", "read"):
		frappe.throw(_("Not permitted to access this user's preferences"))
	
	try:
		# Get user defaults/preferences
		user_defaults = frappe.defaults.get_user_defaults(user)
		
		# Default preferences
		preferences = {
			"email_notifications": True,
			"session_reminders": True,
			"comment_notifications": True,
			"auto_play_videos": True,
			"theme": "light",
			"language": "en",
			"time_zone": frappe.db.get_value("User", user, "time_zone") or "UTC"
		}
		
		# Override with user-specific preferences if they exist
		if user_defaults:
			preferences.update(user_defaults)
		
		return preferences
		
	except Exception as e:
		frappe.log_error(f"Error getting user preferences: {str(e)}")
		frappe.throw(_("Failed to get user preferences"))


@frappe.whitelist()
def update_user_preferences(**kwargs):
	"""Update user preferences/settings"""
	user = kwargs.get('user') or frappe.session.user
	
	# Security check
	if user != frappe.session.user and not frappe.has_permission("User", "write"):
		frappe.throw(_("Not permitted to update this user's preferences"))
	
	try:
		# Remove user from kwargs to avoid storing it as preference
		kwargs.pop('user', None)
		
		# Store preferences as user defaults
		for key, value in kwargs.items():
			frappe.defaults.set_user_default(key, value, user)
		
		frappe.db.commit()
		
		return {
			"status": "success",
			"message": _("Preferences updated successfully")
		}
		
	except Exception as e:
		frappe.log_error(f"Error updating user preferences: {str(e)}")
		frappe.throw(_("Failed to update user preferences"))


@frappe.whitelist()
def upload_user_avatar():
	"""Handle current user avatar upload"""
	user = frappe.session.user
	
	print(f"📸 DEBUG: upload_user_avatar called for {user}")
	
	try:
		# Get uploaded file
		files = frappe.request.files
		if 'file' not in files:
			print("❌ No file in request")
			frappe.throw(_("No file uploaded"))
		
		file = files['file']
		if file.filename == '':
			print("❌ Empty filename")
			frappe.throw(_("No file selected"))
		
		print(f"📁 File received: {file.filename}")
		
		# Validate file type
		allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
		if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions:
			# Save file
			from frappe.utils.file_manager import save_file
			
			file_doc = save_file(
				fname=file.filename,
				content=file.read(),
				dt="User",
				dn=user,
				is_private=0
			)
			
			# Update user's avatar
			user_doc = frappe.get_doc("User", user)
			user_doc.user_image = file_doc.file_url
			user_doc.save(ignore_permissions=True)
			frappe.db.commit()
			
			print(f"✅ Avatar updated for {user}: {file_doc.file_url}")
			return {
				"status": "success",
				"message": "Avatar updated successfully",
				"file_url": file_doc.file_url
			}
		else:
			print(f"❌ Invalid file type: {file.filename}")
			frappe.throw(_("Invalid file type. Please upload an image file."))
			
	except Exception as e:
		print(f"❌ Error uploading avatar for {user}: {str(e)}")
		frappe.log_error(f"Error uploading avatar: {str(e)}")
		frappe.throw(_("Failed to upload avatar"))


@frappe.whitelist()
def get_user_profile_with_roles():
	"""Get current user profile information and roles in a single call"""
	user = frappe.session.user
	print(f"🚀 DEBUG: get_user_profile_with_roles called for session.user={user}")
	
	try:
		user_doc = frappe.get_doc("User", user)
		
		# Get user roles
		roles = [role.role for role in user_doc.roles]
		frappe_roles = frappe.get_roles(user)
		
		# Get user role profile - simplified
		role_profile = "User"
		if user_doc.role_profile_name:
			role_profile = user_doc.role_profile_name
		elif user_doc.roles:
			role_profile = user_doc.roles[0].role
		
		# Combined response with both profile and roles
		combined_data = {
			# Profile data
			"profile": {
				"name": user_doc.name,
				"email": user_doc.email,
				"first_name": user_doc.first_name or "",
				"last_name": user_doc.last_name or "",
				"full_name": user_doc.full_name or get_fullname(user),
				"phone": user_doc.phone or "",
				"mobile_no": user_doc.mobile_no or "",
				"location": user_doc.location or "",
				"bio": user_doc.bio or "",
				"user_image": user_doc.user_image or "",
				"gender": user_doc.gender or "",
				"language": user_doc.language or "en",
				"role_profile_name": role_profile,
				"creation": user_doc.creation,
				"last_login": user_doc.last_login,
				"enabled": user_doc.enabled,
				"time_zone": user_doc.time_zone or ""
			},
			# Roles data
			"roles": {
				"user": user,
				"roles": roles,
				"frappe_roles": frappe_roles,
				"role_profile_name": user_doc.role_profile_name,
				"debug_info": {
					"user_doc_name": user_doc.name,
					"roles_count": len(user_doc.roles),
					"enabled": user_doc.enabled
				}
			}
		}
		
		# Debug logging
		print(f"✅ Combined profile+roles loaded for {user}:")
		print(f"  - Profile: {user_doc.full_name}")
		print(f"  - Roles count: {len(roles)}")
		print(f"  - Roles: {roles[:5]}..." if len(roles) > 5 else f"  - Roles: {roles}")
		
		return combined_data
		
	except frappe.DoesNotExistError:
		print(f"❌ User not found: {user}")
		frappe.throw(_("User not found"))
	except Exception as e:
		print(f"❌ Error getting combined user data for {user}: {str(e)}")
		frappe.log_error(f"Error getting combined user data: {str(e)}")
		frappe.throw(_("Failed to get user data"))


@frappe.whitelist()
def get_user_stats(user=None):
	"""Get user statistics and activity"""
	if not user:
		user = frappe.session.user
	
	# Security check
	if user != frappe.session.user and not frappe.has_permission("User", "read"):
		frappe.throw(_("Not permitted to access this user's statistics"))
	
	try:
		# Get user statistics
		stats = {
			"total_sessions": 0,
			"total_comments": 0,
			"total_watch_time": 0,
			"last_active": None,
			"favorite_topics": [],
			"recent_activity": []
		}
		
		# Count sessions assigned to user (if doctor doctype exists)
		if frappe.db.exists("DocType", "Session Assignment"):
			stats["total_sessions"] = frappe.db.count("Session Assignment", {
				"doctor": user,
				"docstatus": ["!=", 2]
			})
		
		# Count comments by user
		if frappe.db.exists("DocType", "Video Comment"):
			stats["total_comments"] = frappe.db.count("Video Comment", {
				"doctor": user,
				"docstatus": ["!=", 2]
			})
		
		# Get last login
		last_login = frappe.db.get_value("User", user, "last_login")
		if last_login:
			stats["last_active"] = last_login
		
		return stats
		
	except Exception as e:
		frappe.log_error(f"Error getting user stats: {str(e)}")
		return {
			"total_sessions": 0,
			"total_comments": 0,
			"total_watch_time": 0,
			"last_active": None,
			"favorite_topics": [],
			"recent_activity": []
		}