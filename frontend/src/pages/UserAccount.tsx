import { useState, useEffect, useRef } from 'react';
import { useFrappeAuth, useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { getDisplayRoles } from '../utils/roleUtils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  Save, 
  X, 
  Edit3, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Key,
  Upload,
  Check,
  AlertCircle,
  UserCog,
  Settings,
  Lock,
  Clock,
} from 'lucide-react';
import Navbar from '../components/Navbar';

interface UserProfile {
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  mobile_no?: string;
  location?: string;
  bio?: string;
  user_image?: string;
  gender?: string;
  language?: string;
  role_profile_name?: string;
  creation?: string;
  last_login?: string;
  enabled: number;
  time_zone?: string;
}


interface PasswordChangeForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UserAccount = () => {
  const { currentUser } = useFrappeAuth();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    session_notifications: true,
    comment_notifications: true,
    system_notifications: true,
    auto_play_videos: true,
    theme: 'light'
  });
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Use parallel API calls - let them handle authentication internally
  const { data: userResponse, error: userError, mutate: refreshUser, isLoading: userLoading } = useFrappeGetCall(
    'surgical_training.api.user.get_user_profile',
    undefined,
    currentUser ? `user-profile-${currentUser}` : null, // Use currentUser as key
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: rolesResponse, error: rolesError, isLoading: rolesLoading } = useFrappeGetCall(
    'surgical_training.api.user.get_user_roles',
    undefined,
    currentUser ? `user-roles-${currentUser}` : null, // Use currentUser as key
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Combined loading state (used in loading conditions)
  const isLoading = userLoading || rolesLoading;

  const { call: updateProfile } = useFrappePostCall('surgical_training.api.user.update_user_profile');
  const { call: changePassword } = useFrappePostCall('surgical_training.api.user.change_password');
  const { upload: uploadFile } = useFrappeFileUpload();

  // Force immediate role loading when currentUser becomes available
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 CurrentUser detected, triggering immediate data fetch:', currentUser);
      
      // Force immediate refresh of both APIs
      setTimeout(() => {
        refreshUser();
      }, 100); // Small delay to ensure hooks are ready
    }
  }, [currentUser, refreshUser]);

  // Also add a backup effect for roles specifically
  useEffect(() => {
    if (currentUser && !rolesResponse && !rolesLoading && !rolesError) {
      // Force roles refresh with a short delay
      setTimeout(() => {
        refreshUser(); 
      }, 200);
    }
  }, [currentUser, rolesResponse, rolesLoading, rolesError, refreshUser]);

  // Load user profile - Optimized to show roles ASAP and profile when ready
  useEffect(() => {
    if (userError || rolesError) {
      console.error('🚨 API ERRORS:', { userError, rolesError });
    }
    
    // Handle different response structures from frappe-react-sdk
    const profileData = userResponse?.message || userResponse;
    
    // Set profile as soon as we have profile data (don't wait for roles for basic profile info)
    if (profileData && typeof profileData === 'object' && profileData.name && !profile) {
      console.log('✅ Profile data loaded, setting profile');
      console.log('Profile data:', profileData);
      
      setProfile(profileData);
      setEditedProfile(profileData);
    } else if ((userError || rolesError) && currentUser && !profile) {
      console.log('⚠️ API error, creating fallback profile');
      // If there's an error but we have a currentUser, create a basic profile
      const basicProfile = {
        name: currentUser,
        email: currentUser,
        first_name: currentUser.split('@')[0]?.split('.')[0] || 'User',
        last_name: currentUser.split('@')[0]?.split('.')[1] || '',
        full_name: currentUser.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User',
        phone: '',
        gender: '',
        language: 'en',
        role_profile_name: 'User',
        enabled: 1,
        time_zone: ''
      };
      setProfile(basicProfile);
      setEditedProfile(basicProfile);
    } else {
      console.log('⏳ Waiting for profile data...', {
        hasProfile: !!profileData,
        hasRoles: !!rolesResponse,
        userLoading,
        rolesLoading
      });
    }
  }, [userResponse, rolesResponse, userError, rolesError, currentUser, userLoading, rolesLoading]);

  // Initialize loading when user is authenticated
  useEffect(() => {
    if (currentUser && !loadingStartTime) {
      setLoadingStartTime(Date.now());
      setSimulatedProgress(0);
      setLoadingSteps([]);
    } else if (!currentUser) {
      setLoadingStartTime(null);
      setSimulatedProgress(0);
      setLoadingSteps([]);
    }
  }, [currentUser, loadingStartTime]);

  // Gradual loading progression over 4-5 seconds
  useEffect(() => {
    if (!currentUser || !loadingStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - loadingStartTime;
      const duration = 4500; // 4.5 seconds to reach 99%
      
      // Calculate progress based on time elapsed (non-linear for more realistic feel)
      let timeProgress = Math.min(elapsed / duration, 1);
      
      // Use easing function for more natural progression
      // Fast start, then slower towards the end
      const easedProgress = timeProgress < 0.5 
        ? 2 * timeProgress * timeProgress 
        : 1 - Math.pow(-2 * timeProgress + 2, 3) / 2;
      
      const targetProgress = Math.min(easedProgress * 99, 99); // Cap at 99%
      
      // Update steps based on time progression - simplified
      const steps: string[] = [];
      
      if (elapsed > 300) {
        steps.push('✓ Authenticating');
      }
      if (elapsed > 2000) {
        steps.push('✓ Loading profile');
      }
      
      setSimulatedProgress(targetProgress);
      setLoadingSteps(steps);
      
      // Check if we should complete loading (when profile is ready - don't wait for roles to finish completely)
      if (profile && elapsed > 1000) {
        setSimulatedProgress(100);
        steps.push('✓ Ready');
        setLoadingSteps(steps);
        clearInterval(interval);
      }
      
      // Force completion after 8 seconds even if APIs haven't responded
      if (elapsed > 8000) {
        setSimulatedProgress(100);
        clearInterval(interval);
      }
      
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [currentUser, loadingStartTime, profile]);

  // Timeout mechanism for loading
  useEffect(() => {
    if (currentUser && !profile && !userError) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        // Create fallback profile after timeout
        const fallbackProfile = {
          name: currentUser,
          email: currentUser,
          first_name: currentUser.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User',
          last_name: '',
          full_name: currentUser.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User',
          phone: '',
          gender: '',
          language: 'en',
          role_profile_name: 'User',
          enabled: 1,
          time_zone: ''
        };
        setProfile(fallbackProfile);
        setEditedProfile(fallbackProfile);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [currentUser, profile, userError]);

  // Handle profile field changes
  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !currentUser) return;

    setIsUploadingAvatar(true);
    try {
      // Use Frappe SDK's file upload which handles CSRF properly
      const fileDoc = await uploadFile(avatarFile, {
        doctype: 'User',
        docname: currentUser,
        fieldname: 'user_image',
        isPrivate: false
      });

      if (fileDoc?.file_url) {
        // Update the user's avatar field
        await updateProfile({ user_image: fileDoc.file_url });
        
        toast.success('Avatar updated successfully');
        setAvatarFile(null);
        setAvatarPreview(null);
        await refreshUser();
      } else {
        throw new Error('Upload failed - no file URL returned');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!currentUser || !editedProfile) return;

    setIsSaving(true);
    try {
      // Send only the editable fields that the backend expects
      const updateData = {
        first_name: editedProfile.first_name || '',
        last_name: editedProfile.last_name || '',
        phone: editedProfile.phone || '',
        gender: editedProfile.gender || '',
        language: editedProfile.language || 'en',
        time_zone: editedProfile.time_zone || ''
      };

      console.log('Sending update data:', updateData);
      
      await updateProfile(updateData);

      toast.success('Profile updated successfully');
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile || {});
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (userError && !profile) {
    console.error('UserAccount API Error:', userError);
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="account" />
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600">Failed to load user profile data.</p>
            <p className="text-xs text-gray-500 mt-2">Error: {JSON.stringify(userError)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="account" />
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="flex justify-center items-center h-96 flex-col">
            {/* Loading Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {loadingTimeout ? 'Loading timeout - using fallback data...' : 'Loading Your Profile'}
              </h2>
              <p className="text-gray-600">Please wait while we fetch your account information</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-indigo-600">{Math.round(simulatedProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${simulatedProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Loading Steps */}
            <div className="w-full max-w-md space-y-3 mb-6">
              {loadingSteps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex items-center text-sm text-gray-700 transition-all duration-500 ease-in-out"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  {step}
                </div>
              ))}
              
              {/* Show next expected step */}
              {simulatedProgress < 99 && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
                  {simulatedProgress < 50 && "Loading..."}
                  {simulatedProgress >= 50 && "Almost ready..."}
                </div>
              )}
              
            </div>

            {/* Debug Information (collapsed by default) */}
            <details className="w-full max-w-md text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 mb-2">
                Debug Information
              </summary>
              <div className="bg-gray-100 p-3 rounded-md space-y-1">
                <p>Current User: {currentUser || 'None'}</p>
                <p>Overall Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>Profile Loading: {userLoading ? 'Yes' : 'No'}</p>
                <p>Roles Loading: {rolesLoading ? 'Yes' : 'No'}</p>
                <p>Profile Data: {userResponse ? 'Received' : 'Waiting'}</p>
                <p>Roles Data: {rolesResponse ? 'Received' : 'Waiting'}</p>
                <p>Profile Error: {userError ? 'Yes' : 'No'}</p>
                <p>Roles Error: {rolesError ? 'Yes' : 'No'}</p>
                {rolesResponse && (
                  <div className="mt-2">
                    <p className="font-medium">Roles Data:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(rolesResponse, null, 2)}
                    </pre>
                  </div>
                )}
                {userError && (
                  <p className="text-red-500">Profile Error: {JSON.stringify(userError)}</p>
                )}
                {rolesError && (
                  <p className="text-red-500">Roles Error: {JSON.stringify(rolesError)}</p>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="account" />
      
      <div className="max-w-4xl mx-auto pt-8 pb-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile information and account preferences</p>
          
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Avatar and Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                    {avatarPreview || profile.user_image ? (
                      <img
                        src={avatarPreview || profile.user_image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-white" />
                    )}
                  </div>
                  
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                
                {avatarFile && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <>
                          <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} className="mr-1" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Mail size={14} />
                  {profile.email}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={14} />
                  <span>Role Profile: {profile.role_profile_name || 'User'}</span>
                </div>

                {/* Display actual user roles */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCog size={14} />
                    <span>Assigned Roles:</span>
                  </div>
                  {rolesError ? (
                    <div className="text-xs text-red-500 ml-6">
                      Error loading roles: {JSON.stringify(rolesError)}
                    </div>
                  ) : (() => {
                    // Handle different response structures from frappe-react-sdk
                    const rolesData = rolesResponse?.message || rolesResponse;
                    let userRoles = rolesData?.roles || [];
                    
                    // Fallback to frappe_roles if main roles array is empty  
                    if (userRoles.length === 0 && rolesData?.frappe_roles) {
                      userRoles = rolesData.frappe_roles;
                    }
                    
                    // Get display-friendly roles using the utility function
                    const displayRoles = getDisplayRoles(userRoles);
                    
                    

                    return (
                      <div className="ml-6 flex flex-wrap gap-1">
                        {rolesLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
                            <span className="text-xs text-gray-500">Loading roles...</span>
                          </div>
                        ) : (
                          displayRoles.map((role, index: number) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.color}`}
                            >
                              {role.name}
                            </span>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>Joined: {formatDate(profile.creation || '')}</span>
                </div>
                
                {profile.last_login && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>Last login: {formatDate(profile.last_login)}</span>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 text-sm ${profile.enabled ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${profile.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Status: {profile.enabled ? 'Active' : 'Inactive'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings size={18} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  <Key size={16} className="mr-2" />
                  Change Password
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <X size={16} className="mr-2" />
                      Cancel Editing
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} className="mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog size={20} />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.first_name || ''}
                        onChange={(e) => handleProfileChange('first_name', e.target.value)}
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.first_name || 'Not set'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.last_name || ''}
                        onChange={(e) => handleProfileChange('last_name', e.target.value)}
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.last_name || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.phone || editedProfile.mobile_no || ''}
                        onChange={(e) => handleProfileChange('mobile_no', e.target.value)}
                        placeholder="Enter phone number"
                        type="tel"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.phone || profile.mobile_no || 'Not set'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedProfile.location || ''}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        placeholder="Enter your location"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.location || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedProfile.bio || ''}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.bio || 'No bio provided'}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Change Form */}
            {showPasswordForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock size={20} />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your account password for better security
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          placeholder="Enter new password"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? (
                          <>
                            <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Check size={16} className="mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications and updates
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {[
                  { key: 'session_notifications', label: 'Session Notifications', description: 'Get notified about new training sessions and assignments' },
                  { key: 'comment_notifications', label: 'Comment Notifications', description: 'Receive notifications when someone comments on videos' },
                  { key: 'system_notifications', label: 'System Notifications', description: 'Receive important system updates and announcements' },
                  { key: 'auto_play_videos', label: 'Auto-play Videos', description: 'Automatically play videos in sessions' },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{pref.label}</p>
                      <p className="text-sm text-gray-600">{pref.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[pref.key as keyof typeof preferences] as boolean}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [pref.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;