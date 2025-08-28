import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PasswordStrengthIndicator, validatePasswordStrength } from "@/components/PasswordStrengthIndicator";
import { createRateLimiter } from "@/lib/validation";
import { useSecurityLogging } from "@/hooks/useSecurityLogging";

// Rate limiting for authentication attempts (max 5 attempts per 15 minutes)
const authRateLimit = createRateLimiter(5, 15 * 60 * 1000);

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logAuthAttempt } = useSecurityLogging();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const clientId = email || 'unknown';
    if (!authRateLimit(clientId)) {
      setRateLimited(true);
      toast({
        title: "Rate Limited",
        description: "Too many attempts. Please wait 15 minutes before trying again.",
        variant: "destructive",
      });
      // Log suspicious activity
      logAuthAttempt(false, email, "Rate limited - too many attempts");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Too Weak",
        description: passwordValidation.errors.join(". "),
        variant: "destructive",
      });
      logAuthAttempt(false, email, "Weak password rejected");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setFailedAttempts(prev => prev + 1);
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
      // Log failed attempt
      logAuthAttempt(false, email, error.message);
    } else {
      setFailedAttempts(0);
      toast({
        title: "Success",
        description: "Check your email for the confirmation link!",
      });
      // Log successful attempt
      logAuthAttempt(true, email);
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const clientId = email || 'unknown';
    if (!authRateLimit(clientId)) {
      setRateLimited(true);
      toast({
        title: "Rate Limited",
        description: "Too many attempts. Please wait 15 minutes before trying again.",
        variant: "destructive",
      });
      // Log suspicious activity
      logAuthAttempt(false, email, "Rate limited - too many attempts");
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setFailedAttempts(prev => prev + 1);
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      // Log failed attempt
      logAuthAttempt(false, email, error.message);
    } else {
      setFailedAttempts(0);
      toast({
        title: "Success",
        description: "Welcome back!",
      });
      navigate("/");
      // Log successful attempt
      logAuthAttempt(true, email);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Missionary Bridges
          </CardTitle>
          <CardDescription>
            Connect with churches worldwide through our outreach platform
          </CardDescription>
          
          {/* Security warnings */}
          {failedAttempts > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <p className="font-medium">Security Alert</p>
                  <p className="text-xs">
                    {failedAttempts === 1 ? "1 failed attempt" : `${failedAttempts} failed attempts`}. 
                    {failedAttempts >= 3 && " Account may be locked after 5 failed attempts."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {rateLimited && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-red-800 dark:text-red-200 text-sm">
                  <p className="font-medium">Rate Limited</p>
                  <p className="text-xs">Too many failed attempts. Please wait 15 minutes before trying again.</p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || rateLimited}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t('auth.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || rateLimited}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || rateLimited}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || rateLimited}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Enter a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setShowPasswordStrength(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowPasswordStrength(true)}
                    required
                    disabled={isLoading || rateLimited}
                  />
                  
                  {/* Password strength indicator for signup */}
                  {showPasswordStrength && (
                    <PasswordStrengthIndicator 
                      password={password} 
                      className="mt-2"
                    />
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || rateLimited || !validatePasswordStrength(password).isValid}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signUp')}
                </Button>
                
                {/* Security notice */}
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Shield className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Security Notice</p>
                      <p className="text-blue-700 dark:text-blue-300">Your password is encrypted and secure. We enforce strong password requirements to protect your account.</p>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;