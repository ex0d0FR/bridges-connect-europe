import { useState } from "react";
import { useIsAdmin, useAllProfiles, useUpdateUserStatus, useDeleteUser, useGetUserActivity, UserStatus } from "@/hooks/useProfile";
import { AdminSecurityDashboard } from "@/components/AdminSecurityDashboard";
import { UserActivityDisplay } from "@/components/UserActivityDisplay";
import { useUserActivityMonitor } from "@/hooks/useUserActivityMonitor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSecurityLogging } from "@/hooks/useSecurityLogging";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle,
  User,
  Ban,
  Trash2,
  UserCheck,
  UserX,
  RotateCcw,
  Activity
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UserManagement() {
  const isAdmin = useIsAdmin();
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const updateUserStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const { logAdminAction } = useSecurityLogging();
  const { logUserAction } = useUserActivityMonitor();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "delete" | "reactivate" | null>(null);

  // Log page access
  logUserAction('page_access', 'user_management', { page: 'user_management' });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingUsers = profiles?.filter(p => p.status === 'pending') || [];
  const approvedUsers = profiles?.filter(p => p.status === 'approved') || [];
  const rejectedUsers = profiles?.filter(p => p.status === 'rejected') || [];
  const suspendedUsers = profiles?.filter(p => p.status === 'suspended') || [];

  const handleUserAction = async (user: any, action: "approve" | "reject" | "suspend" | "delete" | "reactivate") => {
    try {
      if (action === 'delete') {
        await deleteUser.mutateAsync(user.id);
        
        logAdminAction(`user_management_${action}`, user.id, {
          user_email: user.email,
          previous_status: user.status,
          new_status: 'deleted',
        });
      } else {
        const statusMap = {
          approve: 'approved' as UserStatus,
          reject: 'rejected' as UserStatus, 
          suspend: 'suspended' as UserStatus,
          reactivate: 'approved' as UserStatus
        };
        
        await updateUserStatus.mutateAsync({
          userId: user.id,
          status: statusMap[action],
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        });

        logAdminAction(`user_management_${action}`, user.id, {
          user_email: user.email,
          previous_status: user.status,
          new_status: statusMap[action],
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
        });
      }

      setDialogOpen(false);
      setRejectionReason("");
      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, approvals, and security monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">Admin Dashboard</span>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Dashboard
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            My Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profiles?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingUsers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedUsers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedUsers.length + suspendedUsers.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Users */}
          {pendingUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Approval ({pendingUsers.length})
                </CardTitle>
                <CardDescription>Users waiting for approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('approve');
                          setDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('reject');
                          setDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Approved Users */}
          {approvedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Approved Users ({approvedUsers.length})
                </CardTitle>
                <CardDescription>Active users with full access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Approved: {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('suspend');
                          setDialogOpen(true);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('delete');
                          setDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rejected Users */}
          {rejectedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Rejected Users ({rejectedUsers.length})
                </CardTitle>
                <CardDescription>Users denied access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rejectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Reason: {user.rejection_reason || 'No reason provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('reactivate');
                          setDialogOpen(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('delete');
                          setDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suspended Users */}
          {suspendedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Suspended Users ({suspendedUsers.length})
                </CardTitle>
                <CardDescription>Users temporarily blocked from access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {suspendedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <Badge variant="outline" className="border-orange-500 text-orange-700">
                            <Ban className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Suspended: {new Date(user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('reactivate');
                          setDialogOpen(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('delete');
                          setDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          <AdminSecurityDashboard />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityDisplay />
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve User'}
              {actionType === 'reject' && 'Reject User'}
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'delete' && 'Delete User'}
              {actionType === 'reactivate' && 'Reactivate User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {actionType === 'delete' && (
                    <span className="text-red-600 font-medium">
                      This action cannot be undone. Are you sure you want to permanently delete {selectedUser.email}?
                    </span>
                  )}
                  {actionType !== 'delete' && `Are you sure you want to ${actionType} ${selectedUser.email}?`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {actionType === 'reject' ? 'Rejection Reason' : 'Suspension Reason'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={`Please provide a reason for ${actionType}...`}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'approve' || actionType === 'reactivate' ? 'default' : 'destructive'}
                onClick={() => selectedUser && actionType && handleUserAction(selectedUser, actionType)}
                disabled={(actionType === 'reject' || actionType === 'suspend') && !rejectionReason.trim()}
              >
                {actionType === 'delete' && 'Permanently Delete'}
                {actionType !== 'delete' && `Confirm ${actionType}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}