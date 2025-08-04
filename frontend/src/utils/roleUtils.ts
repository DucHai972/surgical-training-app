// Role mapping utilities for consistent role display across the application

export interface DisplayRole {
  name: string;
  color: string;
}

export interface RoleMapping {
  [key: string]: DisplayRole;
}

// Define the role mapping for user-friendly names and colors
export const roleMapping: RoleMapping = {
  'System Manager': { name: 'Admin', color: 'bg-red-100 text-red-800' },
  'Role Administrator': { name: 'Admin', color: 'bg-red-100 text-red-800' },
  'Administrator': { name: 'Admin', color: 'bg-red-100 text-red-800' },
  'Doctor': { name: 'Doctor', color: 'bg-blue-100 text-blue-800' },
  'Physician': { name: 'Doctor', color: 'bg-blue-100 text-blue-800' },
  'Surgical Trainer': { name: 'Trainer', color: 'bg-green-100 text-green-800' },
  'Surgical Trainee': { name: 'Trainee', color: 'bg-yellow-100 text-yellow-800' },
  'HR Manager': { name: 'Manager', color: 'bg-purple-100 text-purple-800' },
  'Accounts Manager': { name: 'Manager', color: 'bg-purple-100 text-purple-800' },
  'Sales Manager': { name: 'Manager', color: 'bg-purple-100 text-purple-800' },
  'Desk User': { name: 'User', color: 'bg-gray-100 text-gray-800' },
};

/**
 * Get display-friendly roles from raw Frappe roles - only show Admin/Doctor or Guest
 * @param roles - Array of raw role names from Frappe
 * @returns Array of DisplayRole objects with friendly names and colors
 */
export const getDisplayRoles = (roles: string[]): DisplayRole[] => {
  if (!roles || roles.length === 0) {
    return [{ name: 'Guest', color: 'bg-gray-100 text-gray-800' }];
  }

  // Only check for Admin and Doctor roles
  const adminRoles = ['System Manager', 'Role Administrator', 'Administrator'];
  const doctorRoles = ['Doctor', 'Physician'];
  
  const hasAdmin = roles.some(role => adminRoles.includes(role));
  const hasDoctor = roles.some(role => doctorRoles.includes(role));
  
  const displayRoles: DisplayRole[] = [];
  
  // Add Admin role if user has admin permissions
  if (hasAdmin) {
    displayRoles.push({ name: 'Admin', color: 'bg-red-100 text-red-800' });
  }
  
  // Add Doctor role if user has doctor permissions
  if (hasDoctor) {
    displayRoles.push({ name: 'Doctor', color: 'bg-blue-100 text-blue-800' });
  }
  
  // If user has neither Admin nor Doctor role, show Guest
  const result = displayRoles.length > 0 ? displayRoles : [
    { name: 'Guest', color: 'bg-gray-100 text-gray-800' }
  ];
  
  return result;
};

/**
 * Check if user has admin access based on their roles
 * @param roles - Array of raw role names from Frappe
 * @param fallbackCheck - Optional fallback check (e.g., for specific email)
 * @returns boolean indicating if user has admin access
 */
export const hasAdminAccess = (roles: string[], fallbackCheck: boolean = false): boolean => {
  const adminRoles = ['System Manager', 'Role Administrator', 'Administrator'];
  return roles?.some((role: string) => adminRoles.includes(role)) || fallbackCheck;
};

/**
 * Check if user has doctor access based on their roles
 * @param roles - Array of raw role names from Frappe
 * @returns boolean indicating if user has doctor access
 */
export const hasDoctorAccess = (roles: string[]): boolean => {
  const doctorRoles = ['Doctor', 'Physician'];
  return roles?.some((role: string) => doctorRoles.includes(role));
};

/**
 * Get the primary display role name for a user
 * @param roles - Array of raw role names from Frappe
 * @returns string representing the primary role
 */
export const getPrimaryRole = (roles: string[]): string => {
  const displayRoles = getDisplayRoles(roles);
  
  // Prioritize Admin over Doctor over Guest
  if (displayRoles.some(role => role.name === 'Admin')) {
    return 'Admin';
  } else if (displayRoles.some(role => role.name === 'Doctor')) {
    return 'Doctor';
  } else {
    return 'Guest';
  }
};