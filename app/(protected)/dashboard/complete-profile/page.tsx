'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '@jordan6699/washlab-backend/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User, CheckCircle2, Sparkles, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@jordan6699/washlab-backend/dataModel';

interface Branch {
  _id: string;
  name: string;
  city: string;
}

export default function CompleteProfilePage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    branchId: '',
  });

  const branches = useQuery(api.branches.getActive, {}) ?? [];

  // Pre-fill name and phone from Clerk metadata
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      }));
    }
  }, [user]);

  const register = useMutation(api.customers.register);
  const updateProfile = useMutation(api.customers.updateProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please wait for authentication to complete');
      return;
    }

    if (!formData.branchId) {
      toast.error('Please select your branch');
      return;
    }

    setIsLoading(true);

    try {
      try {
        const clerkPhone = (user?.unsafeMetadata?.phoneNumber as string) || (user?.publicMetadata?.phoneNumber as string) || 'pending';
        await register({
          name: formData.name,
          phoneNumber: clerkPhone,
          email: user?.primaryEmailAddress?.emailAddress,
        });
      } catch (regErr: unknown) {
        // Account may already exist, continue
      }

      // Always save branch — updateProfile sets both branchId and preferredBranchId
      try {
        await updateProfile({
          preferredBranchId: formData.branchId as Id<"branches">,
        });
      } catch (updateErr: unknown) {
        console.error('UpdateProfile error:', updateErr);
      }

      setIsComplete(true);
      toast.success('Profile completed successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered')) {
        toast.info('Account already set up! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        return;
      }
      toast.error(err.message || 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Profile Complete!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting you to your dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Just one more step to start using WashLab
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>



            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch">Your Branch <span className="text-destructive">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
                <Select
                  value={formData.branchId}
                  onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your nearest branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches as Branch[]).map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name} — {branch.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the WashLab branch closest to you
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isAuthenticated || !formData.branchId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Your phone number will be used for order updates and notifications
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}