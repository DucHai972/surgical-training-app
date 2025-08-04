// API utility functions with proper CSRF and credentials handling

// Get CSRF token from multiple possible sources
export function getCsrfToken(): string {
  // Helper function to get cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return '';
  };

  // Priority order: meta tag > window.csrf_token > window.frappe.csrf_token > cookie
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const windowToken = (window as any).csrf_token;
  const frappeToken = (window as any).frappe?.csrf_token;
  const cookieToken = getCookie('csrf_token');
  
  const token = metaToken || windowToken || frappeToken || cookieToken || '';
  
  console.log('🔐 CSRF Token Sources:', {
    metaToken: metaToken ? '✅ Found' : '❌ Missing',
    windowToken: windowToken ? '✅ Found' : '❌ Missing', 
    frappeToken: frappeToken ? '✅ Found' : '❌ Missing',
    cookieToken: cookieToken ? '✅ Found' : '❌ Missing',
    selected: token ? `✅ Using (${token.length} chars)` : '❌ No token found'
  });
  
  return token;
}

// Check if we have a valid session
export function hasValidSession(): boolean {
  const cookies = document.cookie.split(';').map(c => c.trim());
  const sidCookie = cookies.find(c => c.startsWith('sid='));
  return !!sidCookie && !sidCookie.includes('Guest');
}

// Check if the current user is an admin
export function isCurrentUserAdmin(currentUser?: string): boolean {
  if (!currentUser || currentUser === 'Guest') {
    return false;
  }
  
  // Check for common admin usernames/emails
  const adminEmails = ['administrator@gmail.com', 'admin@surgicaltraining.store'];
  const isAdminEmail = adminEmails.includes(currentUser);
  
  // Also check if it's the Administrator user
  const isAdministrator = currentUser === 'Administrator';
  
  return isAdminEmail || isAdministrator;
}

// Generic API call function with proper error handling
export async function apiCall(
  path: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  payload: any = {}
): Promise<any> {
  const csrfToken = getCsrfToken();
  
  // For development, detect if we're calling cross-origin
  const isAbsoluteUrl = path.startsWith('http');
  const targetUrl = isAbsoluteUrl ? path : `${window.location.origin}${path}`;
  
  console.log(`🌐 API Call: ${method} ${targetUrl}`, {
    csrfToken: csrfToken ? '✅ Found' : '❌ Missing',
    tokenLength: csrfToken.length,
    hasSession: hasValidSession(),
    payload: method === 'GET' ? 'N/A' : payload
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Always include CSRF token if we have one
  if (csrfToken) {
    headers['X-Frappe-CSRF-Token'] = csrfToken;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for session
  };

  // Add body for non-GET requests
  if (method !== 'GET' && payload !== undefined) {
    config.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(targetUrl, config);
    
    console.log(`🌐 API Response: ${method} ${targetUrl}`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Failed to read error response';
      }
      
      console.error(`🌐 API Error Details:`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: targetUrl,
        method
      });
      
      // Handle specific error types
      if (response.status === 400 && errorText.includes('CSRFTokenError')) {
        throw new Error(`CSRF Token Error: Invalid or missing CSRF token. Try refreshing the page and logging in again.`);
      } else if (response.status === 401) {
        throw new Error(`Authentication Error: Please log in again.`);
      } else if (response.status === 403) {
        throw new Error(`Permission Error: You don't have permission to perform this action.`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    // Try to parse JSON response
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      // If response isn't JSON, return the text
      const text = await response.text();
      return { success: true, data: text };
    }
  } catch (error) {
    console.error(`🌐 API Error: ${method} ${targetUrl}`, error);
    throw error;
  }
}

// Logout function specifically designed for Frappe
export async function logout(): Promise<void> {
  console.log('🔐 Starting logout process...');
  
  // Check if we have a session before attempting logout
  if (!hasValidSession()) {
    console.log('🔐 No valid session found, skipping logout call');
    return;
  }
  
  const token = getCsrfToken();
  
  if (!token) {
    console.warn('🔐 No CSRF token found, attempting logout without token');
  }
  
  // Call logout API
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Only add CSRF token if we have one
  if (token) {
    headers['X-Frappe-CSRF-Token'] = token;
  }

  const response = await fetch('/api/method/logout', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({}) // Empty body required for POST
  });
  
  console.log('🔐 Logout API response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔐 Logout failed:', errorText);
    
    if (response.status === 400 && errorText.includes('CSRFTokenError')) {
      throw new Error('CSRF Token Error: Please refresh the page and try logging out again.');
    }
    
    throw new Error(`Logout failed: HTTP ${response.status} - ${errorText}`);
  }
  
  console.log('🔐 Logout successful');
}

// Specific API functions
export const api = {
  // Comment functions
  addComment: (commentData: any) => 
    apiCall('/api/method/surgical_training.api.comment.add_comment', 'POST', commentData),
  
  updateComment: (commentData: any) => 
    apiCall('/api/method/surgical_training.api.comment.update_comment', 'POST', commentData),
  
  deleteComment: (commentData: any) => 
    apiCall('/api/method/surgical_training.api.comment.delete_comment', 'POST', commentData),

  // Auth functions
  logout,

  // Session functions  
  getSessionDetails: (sessionName: string) => 
    apiCall(`/api/method/surgical_training.api.session.get_session_details?session_name=${encodeURIComponent(sessionName)}`, 'GET'),
}; 