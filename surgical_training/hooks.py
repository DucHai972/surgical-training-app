app_name = "surgical_training"
app_title = "Surgical Training"
app_publisher = "None"
app_description = "None"
app_email = "duchaiz01@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "surgical_training",
# 		"logo": "/assets/surgical_training/logo.png",
# 		"title": "Surgical Training",
# 		"route": "/surgical_training",
# 		"has_permission": "surgical_training.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/surgical_training/css/surgical_training.css"
# app_include_js = "/assets/surgical_training/js/surgical_training.js"

# include js, css files in header of web template
# web_include_css = "/assets/surgical_training/css/surgical_training.css"
# web_include_js = "/assets/surgical_training/js/surgical_training.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "surgical_training/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "surgical_training/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "surgical_training.utils.jinja_methods",
# 	"filters": "surgical_training.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "surgical_training.install.before_install"
# after_install = "surgical_training.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "surgical_training.uninstall.before_uninstall"
# after_uninstall = "surgical_training.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "surgical_training.utils.before_app_install"
# after_app_install = "surgical_training.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "surgical_training.utils.before_app_uninstall"
# after_app_uninstall = "surgical_training.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "surgical_training.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"surgical_training.tasks.all"
# 	],
# 	"daily": [
# 		"surgical_training.tasks.daily"
# 	],
# 	"hourly": [
# 		"surgical_training.tasks.hourly"
# 	],
# 	"weekly": [
# 		"surgical_training.tasks.weekly"
# 	],
# 	"monthly": [
# 		"surgical_training.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "surgical_training.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "surgical_training.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "surgical_training.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["surgical_training.utils.before_request"]
# after_request = ["surgical_training.utils.after_request"]

# Job Events
# ----------
# before_job = ["surgical_training.utils.before_job"]
# after_job = ["surgical_training.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"surgical_training.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Patches
# -------
# Patches to be executed during migration
patches = [
    # "surgical_training.patches.v1_0.migrate_video_to_session_video"  # Disabled - DocType doesn't exist
    "surgical_training.patches.create_role_administrator",
    "surgical_training.patches.fix_role_administrator"
]


website_route_rules = [
    {'from_route': '/surgical_training/<path:app_path>', 'to_route': 'frontend'},
    {'from_route': '/surgical_training', 'to_route': 'frontend'},
]

# API Whitelisted Methods
whitelisted_methods = [
    "surgical_training.api.session.get_sessions",
    "surgical_training.api.session.get_session_details", 
    "surgical_training.api.comment.get_custom_templates",
    "surgical_training.api.video.serve_video_file",
    "surgical_training.api.video.serve_video",
    "surgical_training.api.video_management.create_fallback_video",
    "surgical_training.api.video_management.list_available_videos", 
    "surgical_training.api.video_management.auto_fix_missing_videos",
    "surgical_training.api.user.get_user_profile",
    "surgical_training.api.user.get_user_roles",
    "surgical_training.api.user.get_user_profile_with_roles",
    "surgical_training.api.user.setup_role_administrator",
    "surgical_training.api.user.update_user_profile",
    "surgical_training.api.user.change_password",
    "surgical_training.api.user.get_user_preferences",
    "surgical_training.api.user.update_user_preferences",
    "surgical_training.api.user.upload_user_avatar",
    "surgical_training.api.user.get_user_stats",
    "surgical_training.api.notification.get_user_notifications",
    "surgical_training.api.notification.mark_notification_read",
    "surgical_training.api.notification.mark_all_notifications_read",
    "surgical_training.api.notification.create_notification",
    "surgical_training.api.notification.delete_notification",
    "surgical_training.api.notification.get_notification_count",
    "surgical_training.api.comment_new.add_comment",
    "surgical_training.api.comment_new.get_comments_by_video",
    "surgical_training.api.comment_new.update_comment",
    "surgical_training.api.comment_new.delete_comment",
    "surgical_training.api.comment_new.get_user_permissions",
    "surgical_training.api.comment_new.get_comment_templates",
    "surgical_training.api.comment_new.create_comment_template",
    "surgical_training.api.doctor_session.get_doctor_sessions",
    "surgical_training.api.doctor_session.update_session_status",
    "surgical_training.api.doctor_session.get_session_history",
    "surgical_training.api.doctor_session.get_session_comments",
    "surgical_training.api.doctor_session.get_doctor_dashboard_stats",
    "surgical_training.api.user_activity.get_user_activity_history",
    "surgical_training.api.user_activity.get_user_activity_stats"
]

# Permission hooks for row-level security
permission_query_conditions = {
    "Video Comment": "surgical_training.surgical_training.doctype.video_comment.video_comment.get_permission_query_conditions",
    "Session Assignment": "surgical_training.surgical_training.doctype.session_assignment.session_assignment.get_permission_query_conditions"
}

has_permission = {
    "Video Comment": "surgical_training.surgical_training.doctype.video_comment.video_comment.has_permission",
    "Session Assignment": "surgical_training.surgical_training.doctype.session_assignment.session_assignment.has_permission"
}