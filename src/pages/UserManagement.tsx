import { useState } from "react";
import { useAllProfiles, useUpdateUserStatus, useIsAdmin } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserCheck, UserX, Users, Clock, CheckCircle, XCircle, Pause } from "lucide-react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";

const UserManagement = () => {
  const isAdmin = useIsAdmin();
  const { data: profiles, isLoading } = useAllProfiles();
  const updateUserStatus = useUpdateUserStatus();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
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

  const handleAction = (user: any, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedUser(user);
    setActionType(action);
    setRejectionReason("");
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;
    
    await updateUserStatus.mutateAsync({
      userId: selectedUser.id,
      status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'suspended',
      rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
    });
    
    setSelectedUser(null);
    setActionType(null);
    setRejectionReason("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'suspended':
        return <Pause className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'suspended':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const UserCard = ({ user }: { user: any }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{user.full_name || user.email}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant={getStatusVariant(user.status)} className="flex items-center gap-1">
            {getStatusIcon(user.status)}
            {user.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Registered: {format(new Date(user.created_at), 'PPP')}</p>
          {user.approved_at && (
            <p>Approved: {format(new Date(user.approved_at), 'PPP')}</p>
          )}
          {user.rejection_reason && (
            <p>Rejection reason: {user.rejection_reason}</p>
          )}
        </div>
        
        {user.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => handleAction(user, 'approve')}
              className="flex items-center gap-1"
            >
              <UserCheck className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAction(user, 'reject')}
              className="flex items-center gap-1"
            >
              <UserX className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
        
        {user.status === 'approved' && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(user, 'suspend')}
              className="flex items-center gap-1"
            >
              <Pause className="h-4 w-4" />
              Suspend
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user registrations and approvals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{approvedUsers.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{rejectedUsers.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{suspendedUsers.length}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Pending Approval ({pendingUsers.length})
          </h2>
          {pendingUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      <Separator />

      {/* Approved Users */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Approved Users ({approvedUsers.length})
        </h2>
        {approvedUsers.length === 0 ? (
          <p className="text-muted-foreground">No approved users yet.</p>
        ) : (
          approvedUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </div>

      {/* Other statuses */}
      {(rejectedUsers.length > 0 || suspendedUsers.length > 0) && (
        <>
          <Separator />
          
          {rejectedUsers.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-500" />
                Rejected Users ({rejectedUsers.length})
              </h2>
              {rejectedUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
          
          {suspendedUsers.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Pause className="h-6 w-6 text-gray-500" />
                Suspended Users ({suspendedUsers.length})
              </h2>
              {suspendedUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedUser && !!actionType} onOpenChange={() => {
        setSelectedUser(null);
        setActionType(null);
        setRejectionReason("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve User'}
              {actionType === 'reject' && 'Reject User'}
              {actionType === 'suspend' && 'Suspend User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will approve the user and grant them access to the application.'}
              {actionType === 'reject' && 'This will reject the user\'s application. They will not be able to access the application.'}
              {actionType === 'suspend' && 'This will suspend the user\'s access to the application.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
              </div>
              
              {actionType === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedUser(null);
              setActionType(null);
              setRejectionReason("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={updateUserStatus.isPending || (actionType === 'reject' && !rejectionReason.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {updateUserStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {actionType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
