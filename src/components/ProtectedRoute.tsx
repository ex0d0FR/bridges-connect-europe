import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw, Shield } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserActivityMonitor } from "@/hooks/useUserActivityMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading, signOut, userStatus, isApproved } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile();
  const { logPageAccess } = useUserActivityMonitor();

  // Log page access for security monitoring
  useEffect(() => {
    if (user && isApproved) {
      const currentPath = window.location.pathname;
      logPageAccess(currentPath);
    }
  }, [user, isApproved, logPageAccess]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is approved - use context first, fallback to profile
  const actualStatus = userStatus || profile?.status;
  const actualIsApproved = isApproved || profile?.status === 'approved';
  
  if (profile && !actualIsApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-orange-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">Account Security Check</CardTitle>
            <CardDescription>
              Your account requires administrator approval to access this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actualStatus === 'pending' && (
              <Alert>
                <AlertDescription>
                  Thank you for registering! Your account is currently pending approval. 
                  An administrator will review your request and notify you once approved.
                </AlertDescription>
              </Alert>
            )}
            
            {actualStatus === 'rejected' && (
              <Alert variant="destructive">
                <AlertDescription>
                  Your account application has been rejected.
                  {profile?.rejection_reason && (
                    <span className="block mt-2">
                      <strong>Reason:</strong> {profile.rejection_reason}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {actualStatus === 'suspended' && (
              <Alert variant="destructive">
                <AlertDescription>
                  Your account has been suspended. Please contact an administrator for more information.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium capitalize">{actualStatus}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All access is restricted until approval is granted for security purposes.
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </Button>
              <Button 
                variant="secondary" 
                onClick={signOut} 
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;