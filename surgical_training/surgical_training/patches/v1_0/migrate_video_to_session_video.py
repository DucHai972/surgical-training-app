import frappe
from frappe.model.utils.rename_field import rename_field


def execute():
    """
    Migrate Video child table to Session Video to avoid conflict with ERPNext Video doctype
    """
    
    # Check if the Video table exists and has child table structure
    if not frappe.db.table_exists("tabVideo"):
        return
    
    # Check if Session Video table already exists
    if frappe.db.table_exists("tabSession Video"):
        return
    
    try:
        # First, let's check if the Video table has child table columns
        video_columns = frappe.db.get_table_columns("tabVideo")
        has_parent_columns = "parent" in video_columns and "parentfield" in video_columns and "parenttype" in video_columns
        
        if not has_parent_columns:
            # This means we have the ERPNext Video table, not our child table
            # We need to create the Session Video table from scratch
            frappe.reload_doc("surgical_training", "doctype", "session_video")
            return
        
        # If we reach here, we have a proper child table structure
        # Rename the Video table to Session Video
        frappe.db.sql("RENAME TABLE `tabVideo` TO `tabSession Video`")
        
        # Update any references in Session documents
        if frappe.db.table_exists("tabSession"):
            # Update the parenttype in Session Video records
            frappe.db.sql("""
                UPDATE `tabSession Video` 
                SET parenttype = 'Session' 
                WHERE parenttype = 'Session' OR parenttype IS NULL
            """)
        
        # Clear cache to reload doctypes
        frappe.clear_cache()
        
        print("Successfully migrated Video table to Session Video")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        # If there's an error, reload the doctype to create the table properly
        frappe.reload_doc("surgical_training", "doctype", "session_video") 
 
 