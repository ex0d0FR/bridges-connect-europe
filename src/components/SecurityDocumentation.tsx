import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Shield, Lock, Eye } from 'lucide-react';

export const SecurityDocumentation: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Security Configuration Guide</h1>
      </div>

      {/* Authentication Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Authentication Security
          </CardTitle>
          <CardDescription>
            Recommended Supabase authentication security settings for production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Configure these settings in your Supabase dashboard under Authentication → Settings
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">OTP Expiry Time</h4>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Current: Likely set to default (24 hours)
              </p>
              <p className="text-sm">
                <strong>Recommended:</strong> Set to 1 hour (3600 seconds) for better security
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Leaked Password Protection</h4>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Current: Disabled
              </p>
              <p className="text-sm">
                <strong>Action:</strong> Enable "Breach password protection" to prevent users from using compromised passwords
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Password Strength</h4>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <p className="text-sm">
                Ensure minimum password length is set to 8+ characters with complexity requirements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Database Security Status
          </CardTitle>
          <CardDescription>
            Current security implementation status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Row Level Security (RLS) enabled on all tables</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Authentication checks added to all RLS policies</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Input validation triggers implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">User approval system active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Role-based access control implemented</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Security */}
      <Card>
        <CardHeader>
          <CardTitle>Application Security Features</CardTitle>
          <CardDescription>
            Security measures implemented in the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Content Security Policy (CSP) headers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">X-Content-Type-Options: nosniff</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Referrer Policy: strict-origin-when-cross-origin</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Security event logging implemented</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Session timeout protection</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Production Deployment Checklist</CardTitle>
          <CardDescription>
            Security items to verify before going live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="otp-expiry" className="rounded" />
              <label htmlFor="otp-expiry" className="text-sm">Configure OTP expiry to 1 hour in Supabase</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="password-protection" className="rounded" />
              <label htmlFor="password-protection" className="text-sm">Enable leaked password protection</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ssl-cert" className="rounded" />
              <label htmlFor="ssl-cert" className="text-sm">Verify SSL/TLS certificates are properly configured</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="api-keys" className="rounded" />
              <label htmlFor="api-keys" className="text-sm">Rotate all API keys and secrets</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="backup" className="rounded" />
              <label htmlFor="backup" className="text-sm">Configure automated database backups</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};