import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogOut, User, MapPin, Lock, Save, Trash2, Plus } from "lucide-react";

import { userProfileQuery, addressesQuery } from "@/queries";
import { userService } from "@/services/user.service";
import { addressesService } from "@/services/addresses.service";
import { useAuth } from "@/providers/AuthProvider";

import { Container } from "@/components/layout/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Spinner } from "@/components/feedback/Spinner";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: "/account",
        },
      });
    }
  },
  component: AccountPage,
});

const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function AccountPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const { data: profile, isLoading: isLoadingProfile } = useQuery(userProfileQuery(true));
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery(addressesQuery(true));

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(userProfileQuery(true).queryKey, data);
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: userService.updatePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      passwordForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: addressesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressesQuery(true).queryKey });
      toast.success("Address deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete address");
    },
  });

  // Forms
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      email: profile?.email || "",
      phoneNumber: profile?.phoneNumber || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Account</h1>
            <p className="text-muted-foreground mt-1">Manage your settings</p>
          </div>

          <Card className="border-none shadow-md bg-muted/30">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile?.username}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-8 h-12 w-full justify-start bg-transparent border-b rounded-none p-0">
              <TabsTrigger 
                value="profile" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 h-full data-[state=active]:shadow-none"
              >
                <User className="mr-2 h-4 w-4" /> Profile Details
              </TabsTrigger>
              <TabsTrigger 
                value="addresses" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 h-full data-[state=active]:shadow-none"
              >
                <MapPin className="mr-2 h-4 w-4" /> Saved Addresses
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 h-full data-[state=active]:shadow-none"
              >
                <Lock className="mr-2 h-4 w-4" /> Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your email address and phone number.</CardDescription>
                </CardHeader>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}>
                  <CardContent className="space-y-4">
                    <FormField
                      label="Username"
                      htmlFor="username"
                    >
                      <Input
                        id="username"
                        value={profile?.username || ""}
                        disabled
                        className="bg-muted"
                      />
                    </FormField>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Email Address"
                        htmlFor="email"
                        error={profileForm.formState.errors.email?.message}
                      >
                        <Input
                          id="email"
                          {...profileForm.register("email")}
                        />
                      </FormField>

                      <FormField
                        label="Phone Number"
                        htmlFor="phoneNumber"
                        error={profileForm.formState.errors.phoneNumber?.message}
                      >
                        <Input
                          id="phoneNumber"
                          {...profileForm.register("phoneNumber")}
                        />
                      </FormField>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 px-6 py-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}>
                      {updateProfileMutation.isPending ? <Spinner className="mr-2" size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6 animate-in fade-in-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Your Addresses</h3>
                  <p className="text-sm text-muted-foreground">Manage your shipping addresses for faster checkout.</p>
                </div>
                {/* Normally we'd have a dialog to add an address here, but we'll keep it simple for now */}
              </div>

              {isLoadingAddresses ? (
                <div className="flex justify-center p-8">
                  <Spinner />
                </div>
              ) : !addresses || addresses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No saved addresses</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                      You haven't saved any addresses yet. Add one during your next checkout.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <Card key={address.addressId} className="relative overflow-hidden group">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between items-start">
                          <span>{address.fullName}</span>
                          {address.isDefault && (
                            <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>{address.city}, {address.state} {address.postalCode}</p>
                        <p className="mt-2 text-foreground/80">{address.phoneNumber}</p>
                      </CardContent>
                      <CardFooter className="pt-0 border-t mt-4 bg-muted/10 px-6 py-3 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this address?")) {
                              deleteAddressMutation.mutate(address.addressId);
                            }
                          }}
                          disabled={deleteAddressMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-6 animate-in fade-in-50">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password to stay secure.</CardDescription>
                </CardHeader>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))}>
                  <CardContent className="space-y-4 max-w-md">
                    <FormField
                      label="Current Password"
                      htmlFor="currentPassword"
                      error={passwordForm.formState.errors.currentPassword?.message}
                    >
                      <PasswordInput
                        id="currentPassword"
                        {...passwordForm.register("currentPassword")}
                      />
                    </FormField>

                    <FormField
                      label="New Password"
                      htmlFor="newPassword"
                      error={passwordForm.formState.errors.newPassword?.message}
                    >
                      <PasswordInput
                        id="newPassword"
                        {...passwordForm.register("newPassword")}
                      />
                    </FormField>

                    <FormField
                      label="Confirm New Password"
                      htmlFor="confirmPassword"
                      error={passwordForm.formState.errors.confirmPassword?.message}
                    >
                      <PasswordInput
                        id="confirmPassword"
                        {...passwordForm.register("confirmPassword")}
                      />
                    </FormField>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 px-6 py-4">
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending && <Spinner className="mr-2" size="sm" />}
                      Update Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Container>
  );
}
