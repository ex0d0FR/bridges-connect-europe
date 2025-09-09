import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserRoles, useIsAdmin, useAllProfiles } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Debug() {
  const { user, userStatus, isApproved } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useUserRoles();
  const isAdmin = useIsAdmin();
  const { data: allProfiles, isLoading: allProfilesLoading, error: allProfilesError } = useAllProfiles();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Information</h1>
      
      {/* Auth Context */}
      <Card>
        <CardHeader>
          <CardTitle>Auth Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>User ID: {user?.id || 'None'}</div>
          <div>Email: {user?.email || 'None'}</div>
          <div>User Status: <Badge>{userStatus || 'Unknown'}</Badge></div>
          <div>Is Approved: <Badge variant={isApproved ? 'default' : 'destructive'}>{isApproved ? 'Yes' : 'No'}</Badge></div>
        </CardContent>
      </Card>

      {/* Profile Hook */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Hook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Loading: {profileLoading ? 'Yes' : 'No'}</div>
          {profileError && <div className="text-red-600">Error: {JSON.stringify(profileError)}</div>}
          {profile && (
            <div>
              <div>Profile Status: <Badge>{profile.status}</Badge></div>
              <div>Full Name: {profile.full_name || 'None'}</div>
              <div>Created: {new Date(profile.created_at).toLocaleDateString()}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Roles Hook */}
      <Card>
        <CardHeader>
          <CardTitle>User Roles Hook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>Loading: {rolesLoading ? 'Yes' : 'No'}</div>
          {rolesError && <div className="text-red-600">Error: {JSON.stringify(rolesError)}</div>}
          <div>Is Admin: <Badge variant={isAdmin ? 'default' : 'secondary'}>{isAdmin ? 'Yes' : 'No'}</Badge></div>
          {roles && roles.length > 0 ? (
            <div>
              <div>Roles:</div>
              {roles.map((role, index) => (
                <Badge key={index} className="mr-2">{role.role}</Badge>
              ))}
            </div>
          ) : (
            <div>No roles found</div>
          )}
        </CardContent>
      </Card>

      {/* All Profiles Hook (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>All Profiles Hook (Admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Loading: {allProfilesLoading ? 'Yes' : 'No'}</div>
            {allProfilesError && <div className="text-red-600">Error: {JSON.stringify(allProfilesError)}</div>}
            {allProfiles && (
              <div>
                <div>Total Users: {allProfiles.length}</div>
                <div className="mt-2">
                  {allProfiles.slice(0, 3).map((p, index) => (
                    <div key={index} className="border-b pb-1">
                      {p.email} - <Badge variant="secondary">{p.status}</Badge>
                    </div>
                  ))}
                  {allProfiles.length > 3 && <div>... and {allProfiles.length - 3} more</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}