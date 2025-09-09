import { useState } from "react";
import { useIsAdmin, useAllProfiles, useUpdateUserStatus } from "@/hooks/useProfile";
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
  Ban
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UserManagement() {
  const isAdmin = useIsAdmin();
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const updateUserStatus = useUpdateUserStatus();
  const { logAdminAction } = useSecurityLogging();
  const { logUserAction } = useUserActivityMonitor();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | null>(null);

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

  const handleUserAction = async (user: any, action: "approve" | "reject" | "suspend") => {
    try {
      await updateUserStatus.mutateAsync({
        userId: user.id,
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended',
        rejectionReason: action === 'reject' ? rejectionReason : undefined,
      });

      logAdminAction(`user_management_${action}`, user.id, {
        user_email: user.email,
        previous_status: user.status,
        new_status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended',
        rejection_reason: action === 'reject' ? rejectionReason : undefined,
      });

      setDialogOpen(false);
      setRejectionReason("");
      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      console.error('Error updating user status:', error);
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
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Are you sure you want to ${actionType} ${selectedUser.email}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for rejection..."
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
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={() => selectedUser && actionType && handleUserAction(selectedUser, actionType)}
                disabled={actionType === 'reject' && !rejectionReason.trim()}
              >
                Confirm {actionType}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}