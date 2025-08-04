import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { User, Shield, CheckCircle, XCircle } from 'lucide-react';

const RoleChecker = () => {
  const { currentUser } = useFrappeAuth();
  
  // Get user roles
  const { data: rolesData, error: rolesError } = useFrappeGetCall(
    'surgical_training.api.user.get_user_roles'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Role Checker</CardTitle>
                <p className="text-gray-600">Check current user roles and permissions</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current User */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Current User</p>
                <p className="text-sm text-gray-600">{currentUser || 'Not logged in'}</p>
              </div>
            </div>

            {/* Roles Data */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Role Information</h3>
              
              {rolesError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">
                    <strong>API Error:</strong> {rolesError.message || 'Failed to load roles'}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    The get_user_roles API endpoint may not be properly whitelisted.
                  </p>
                </div>
              )}

              {rolesData && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800 mb-2">✅ API Response Received</p>
                    <div className="bg-white p-3 rounded border text-sm font-mono">
                      <pre>{JSON.stringify(rolesData, null, 2)}</pre>
                    </div>
                  </div>

                  {rolesData.roles && (
                    <div>
                      <p className="font-medium mb-2">Current Roles ({rolesData.roles.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {rolesData.roles.map((role: string) => (
                          <Badge key={role} variant="secondary" className="text-sm">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!rolesData && !rolesError && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">Loading role information...</p>
                </div>
              )}
            </div>

            {/* Access Checks */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Access Permissions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Analytics Page</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Requires: Role Administrator, System Manager, or Administrator
                  </p>
                  {rolesData?.roles ? (
                    rolesData.roles.some((role: string) => 
                      ['Role Administrator', 'System Manager', 'Administrator'].includes(role)
                    ) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Access Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Access Denied</span>
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-gray-500">Checking...</span>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">My Sessions Page</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Requires: Physician or Doctor
                  </p>
                  {rolesData?.roles ? (
                    rolesData.roles.some((role: string) => 
                      ['Physician', 'Doctor'].includes(role)
                    ) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Access Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Access Denied</span>
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-gray-500">Checking...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Console Debug */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">🔍 Console Debug Info</p>
              <p className="text-sm text-gray-600">
                Open browser console (F12) to see detailed role debugging information.
                The Analytics and My Sessions pages log role data to console.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleChecker;