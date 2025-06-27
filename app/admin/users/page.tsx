// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
// Remove: import { useAuth } from '@/components/providers/auth-provider'; // Not used directly for fetching here
// Remove: import { createSupabaseBrowserClient } from '@/lib/db';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MoreHorizontal, ShieldCheck, ShieldX, User } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createSupabaseBrowserClient } from '@/lib/db';

const userFormSchema = z.object({
  name: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  isAdmin: z.boolean().default(false),
  isBanned: z.boolean().default(false),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type UserWithProfile = {
  id: string;
  email?: string;
  createdAt: string;
  profile: {
    id: string;
    name: string | null;
    bio: string | null;
    website: string | null;
    avatarUrl: string | null;
  };
  appMetadata?: { // Changed from app_metadata to match typical JS casing for consistency
    role?: string;
  };
  userMetadata?: { // Changed from user_metadata
    banned?: boolean;
  };
};

export default function UsersManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserWithProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      bio: '',
      website: '',
      isAdmin: false,
      isBanned: false,
    },
  });

  useEffect(() => {
   
const loadUsers = async () => {
  setLoading(true);
  try {
    // Get the session first
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session found - please log in');
    }
    
    // Include the auth token in the request headers
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error while fetching users');
    }
    const data: UserWithProfile[] = await response.json();
    setUsers(data);
  } catch (error: any) {
    console.error('Error loading users:', error.message);
    toast.error(`Failed to load users: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
    loadUsers();
  }, []);

  const openUserDialog = (user: UserWithProfile) => {
    setCurrentUser(user);
    form.reset({
      name: user.profile.name || '',
      bio: user.profile.bio || '',
      website: user.profile.website || '',
      isAdmin: user.appMetadata?.role === 'admin',
      isBanned: !!user.userMetadata?.banned,
    });
    setIsDialogOpen(true);
  };

  // IMPORTANT: The onSubmit, makeAdmin, and removeAdmin functions below still use
  // client-side Supabase admin calls. These MUST be refactored to use secure API routes.
  // This snippet focuses on fixing the user loading error.
  // For a complete secure solution, create API routes for these update operations.

  const onSubmit = async (values: UserFormValues) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      // This logic needs to be moved to an API route like POST /api/admin/users/[userId]
      // For example:
      // const response = await fetch(`/api/admin/users/${currentUser.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(values),
      // });
      // if (!response.ok) throw new Error('Failed to update user from API');
      // const updatedUser = await response.json();

      // Placeholder for current logic - this will likely still fail without API route
      const supabase = (await import('@/lib/db')).createSupabaseBrowserClient(); // Temporary for example
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: values.name, bio: values.bio || null, website: values.website || null })
        .eq('id', currentUser.id);
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        currentUser.id,
        {
          app_metadata: { role: values.isAdmin ? 'admin' : undefined },
          user_metadata: { banned: values.isBanned },
        }
      );
      if (metadataError) throw metadataError;
      // End of placeholder

      toast.success('User updated successfully (Note: API route needed for full security)');
      setUsers(users.map(user =>
        user.id === currentUser.id
          ? {
              ...user,
              profile: {
                ...user.profile,
                name: values.name,
                bio: values.bio || null,
                website: values.website || null,
              },
              appMetadata: { ...user.appMetadata, role: values.isAdmin ? 'admin' : undefined },
              userMetadata: { ...user.userMetadata, banned: values.isBanned },
            }
          : user
      ));
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Make Admin / Remove Admin also need to be API calls
  const handleRoleChange = async (userId: string, newRole: 'admin' | null) => {
    // This logic needs to be moved to an API route like POST /api/admin/users/[userId]/role
    // For example:
    // const response = await fetch(`/api/admin/users/${userId}/role`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ role: newRole }),
    // });
    // if (!response.ok) throw new Error('Failed to update role from API');

    // Placeholder for current logic - this will likely still fail without API route
    const supabase = createSupabaseBrowserClient(); // Temporary for example
    try {
        await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: newRole } });
        setUsers(users.map(u => u.id === userId ? { ...u, appMetadata: { ...u.appMetadata, role: newRole ?? undefined } } : u));
        toast.success(`User role ${newRole ? 'set to admin' : 'removed'}`);
    } catch (error: any) {
        toast.error(`Failed to ${newRole ? 'promote' : 'demote'} user: ${error.message}`);
        console.error(error);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-gray-500">
            Manage all users in the Futurama community
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing {users.length} users in the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all users in the community</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(user.profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.profile.name || 'Unnamed User'}</div>
                          <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.userMetadata?.banned ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.appMetadata?.role === 'admin' ? (
                        <div className="flex items-center space-x-1">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span>Admin</span>
                        </div>
                      ) : (
                        <span>User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openUserDialog(user)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Edit User</span>
                          </DropdownMenuItem>
                          {user.appMetadata?.role !== 'admin' ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              <span>Make Admin</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, null)}>
                              <ShieldX className="mr-2 h-4 w-4" />
                              <span>Remove Admin</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Admin Access
                        </FormLabel>
                        <FormDescription>
                          Grant admin privileges to this user
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isBanned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Ban User
                        </FormLabel>
                        <FormDescription>
                          Prevent this user from accessing the community
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}