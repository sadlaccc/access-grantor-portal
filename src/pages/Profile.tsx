import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Briefcase, Shield, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';

const profileSchema = z.object({
  full_name: z.string().trim().max(100, 'Name must be less than 100 characters').nullable(),
  phone: z.string().trim().max(20, 'Phone must be less than 20 characters').nullable(),
  department: z.string().trim().max(50, 'Department must be less than 50 characters').nullable(),
  job_title: z.string().trim().max(50, 'Job title must be less than 50 characters').nullable(),
});

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  show_email: boolean;
  show_phone: boolean;
  show_department: boolean;
  show_job_title: boolean;
  ai_enabled: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    department: '',
    job_title: '',
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    show_email: false,
    show_phone: false,
    show_department: true,
    show_job_title: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as ProfileData;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        job_title: profile.job_title || '',
      });
      setPrivacySettings({
        show_email: profile.show_email ?? false,
        show_phone: profile.show_phone ?? false,
        show_department: profile.show_department ?? true,
        show_job_title: profile.show_job_title ?? true,
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['directory-profiles'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  const handleAvatarUpload = (url: string) => {
    if (url) {
      updateProfileMutation.mutate({ avatar_url: url });
    }
  };

  const handleSaveProfile = () => {
    setErrors({});
    
    const result = profileSchema.safeParse({
      full_name: formData.full_name || null,
      phone: formData.phone || null,
      department: formData.department || null,
      job_title: formData.job_title || null,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    updateProfileMutation.mutate({
      full_name: formData.full_name || null,
      phone: formData.phone || null,
      department: formData.department || null,
      job_title: formData.job_title || null,
    });
  };

  const handleSavePrivacy = () => {
    updateProfileMutation.mutate(privacySettings);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your personal information and privacy preferences</p>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Photo
              </CardTitle>
              <CardDescription>
                Upload a photo to personalize your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <FileUpload
                bucket="avatars"
                folder={user?.id}
                accept="image/png,image/jpeg,image/webp"
                maxSizeMB={5}
                variant="avatar"
                currentUrl={profile?.avatar_url}
                onUploadComplete={handleAvatarUpload}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{profile?.full_name || 'Your Name'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your profile details. Your email cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={100}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    maxLength={20}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Enter your department"
                    maxLength={50}
                  />
                  {errors.department && (
                    <p className="text-xs text-destructive">{errors.department}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="job_title" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Title
                  </Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Enter your job title"
                    maxLength={50}
                  />
                  {errors.job_title && (
                    <p className="text-xs text-destructive">{errors.job_title}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control what information other employees can see in the directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Show Email Address
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other employees to see your email in the directory
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_email}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, show_email: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Show Phone Number
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other employees to see your phone number in the directory
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_phone}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, show_phone: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Show Department
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other employees to see your department in the directory
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_department}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, show_department: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Show Job Title
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other employees to see your job title in the directory
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.show_job_title}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, show_job_title: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSavePrivacy}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
