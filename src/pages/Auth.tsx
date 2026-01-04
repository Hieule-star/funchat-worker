import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Phone, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/logo.png";

const signUpSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255),
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự").max(50),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
});

const signInSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

const phoneSchema = z.object({
  phone: z.string().min(9, "Số điện thoại không hợp lệ").max(15),
});

type AuthMethod = "email" | "phone";

export default function Auth() {
  const { user, signUp, signIn, signInWithPhone, verifyOtp, signInWithGoogle, signInWithFacebook, resendEmailVerification, resetPassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);
  const [showEmailNotVerified, setShowEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  
  // Auth method toggle
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  
  // Auth view toggle (signin/signup)
  const [authView, setAuthView] = useState<"signin" | "signup" | "forgot-password">("signin");
  
  // Forgot password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  
  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+84");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Sign Up Form
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Sign In Form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle email confirmation from URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.has('access_token');

    if (!hasAccessToken) return;

    console.log('Detected access_token in URL, processing email confirmation...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, !!session);
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setShowConfirmationSuccess(true);
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      }
    );

    // Check if session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setShowConfirmationSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Redirect if already logged in (and not showing confirmation)
  useEffect(() => {
    if (user && !showConfirmationSuccess) {
      navigate("/");
    }
  }, [user, navigate, showConfirmationSuccess]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signUpSchema.parse({
        email: signUpEmail,
        username: signUpUsername,
        password: signUpPassword,
      });

      setLoading(true);
      const { error } = await signUp(validated.email, validated.password, validated.username);

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: t("auth.emailExists"),
            description: t("auth.emailExistsDesc"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.registerError"),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("auth.registerSuccess"),
          description: t("auth.registerSuccessDesc"),
        });
        setSignUpEmail("");
        setSignUpUsername("");
        setSignUpPassword("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signInSchema.parse({
        email: signInEmail,
        password: signInPassword,
      });

      setLoading(true);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setShowEmailNotVerified(true);
          setUnverifiedEmail(validated.email);
        } else if (error.message.includes("Invalid login credentials")) {
          toast({
            title: t("auth.invalidCredentials"),
            description: t("auth.invalidCredentialsDesc"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.loginError"),
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("auth.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone authentication handlers
  const handleSendOtp = async () => {
    const fullPhone = `${countryCode}${phoneNumber.replace(/^0/, '')}`;
    
    try {
      phoneSchema.parse({ phone: phoneNumber });
      
      setLoading(true);
      const { error } = await signInWithPhone(fullPhone);

      if (error) {
        if (error.message.includes("Phone provider is not enabled")) {
          toast({
            title: t("auth.smsNotEnabled"),
            description: t("auth.smsNotEnabledDesc"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.otpError"),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("auth.otpSent"),
          description: `${t("auth.otpSentDesc")} ${fullPhone}`,
        });
        setShowOtpInput(true);
        setOtpCountdown(60);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t("common.error"),
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: t("auth.otpInvalid"),
        description: t("auth.otpInvalidDesc"),
        variant: "destructive",
      });
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber.replace(/^0/, '')}`;
    
    setLoading(true);
    const { error } = await verifyOtp(fullPhone, otpCode);

    if (error) {
      toast({
        title: t("auth.otpWrong"),
        description: t("auth.otpWrongDesc"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.loginSuccessDesc"),
      });
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    await handleSendOtp();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();

    if (error) {
      if (error.message.includes("provider is not enabled")) {
        toast({
          title: t("auth.googleNotEnabled"),
          description: t("auth.googleNotEnabledDesc"),
          variant: "destructive",
        });
      } else if (error.message.includes("OAuth state parameter missing")) {
        toast({
          title: t("auth.oauthError"),
          description: t("auth.oauthErrorDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.googleError"),
          description: error.message,
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithFacebook();

    if (error) {
      if (error.message.includes("provider is not enabled")) {
        toast({
          title: t("auth.facebookNotEnabled"),
          description: t("auth.facebookNotEnabledDesc"),
          variant: "destructive",
        });
      } else if (error.message.includes("OAuth state parameter missing")) {
        toast({
          title: t("auth.oauthError"),
          description: t("auth.oauthErrorDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.facebookError"),
          description: error.message,
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleTelegramSignIn = () => {
    toast({
      title: "Telegram Login",
      description: t("auth.telegramDev"),
    });
  };

  const handleResendEmail = async () => {
    if (!unverifiedEmail) return;
    
    setLoading(true);
    const { error } = await resendEmailVerification(unverifiedEmail);
    
    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("auth.emailSent"),
        description: t("auth.emailSentDesc"),
      });
    }
    setLoading(false);
  };

  // Show confirmation success screen
  if (showConfirmationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md p-8 space-y-6 border-2 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-green-600">
            🎉 {t("auth.emailConfirmed")}
          </h2>
          <p className="text-muted-foreground">
            {t("auth.redirecting")}
          </p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </Card>
      </div>
    );
  }

  // OTP verification screen
  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md p-8 space-y-6 border-2">
          <div className="text-center space-y-4">
            <img 
              src={logo} 
              alt="Fun Chat WEB3" 
              className="w-20 h-20 mx-auto rounded-full shadow-lg"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{t("auth.enterOtp")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.otpSentTo")} {countryCode}{phoneNumber}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerifyOtp} 
            className="w-full" 
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.verifying")}
              </>
            ) : (
              t("auth.verify")
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("auth.noOtp")}
            </p>
            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={otpCountdown > 0 || loading}
              className="text-primary"
            >
              {otpCountdown > 0 
                ? `${t("auth.resendAfter")} ${otpCountdown}s` 
                : t("auth.resendOtp")}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => {
              setShowOtpInput(false);
              setOtpCode("");
            }}
          >
            ← {t("auth.back")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md p-8 space-y-6 border-2">
        <div className="text-center space-y-4">
          <img 
            src={logo} 
            alt="Fun Chat WEB3" 
            className="w-20 h-20 mx-auto rounded-full shadow-lg"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("auth.welcome")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.welcomeDesc")}
            </p>
          </div>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setAuthMethod("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              authMethod === "email" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            {t("auth.emailMethod")}
          </button>
          <button
            onClick={() => setAuthMethod("phone")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              authMethod === "phone" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4" />
            {t("auth.phoneMethod")}
          </button>
        </div>

        {/* Email Not Verified Banner */}
        {showEmailNotVerified && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <strong>{t("auth.emailNotVerified")}</strong>
              <br />
              {t("auth.emailNotVerifiedDesc")}
              <Button 
                variant="link" 
                size="sm"
                className="p-0 h-auto ml-2 text-primary"
                onClick={handleResendEmail}
                disabled={loading}
              >
                {t("auth.resendEmail")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Phone Auth */}
        {authMethod === "phone" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="+84">🇻🇳 +84</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+82">🇰🇷 +82</option>
                  <option value="+86">🇨🇳 +86</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="912 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                  disabled={loading}
                />
              </div>
            </div>

            <Button onClick={handleSendOtp} className="w-full" disabled={loading || !phoneNumber}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.sending")}
                </>
              ) : (
                t("auth.receiveOtp")
              )}
            </Button>
          </div>
        )}

        {/* Email Auth - Sign In */}
        {authMethod === "email" && authView === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">{t("auth.email")}</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="your@email.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">{t("auth.password")}</Label>
                <button
                  type="button"
                  onClick={() => setAuthView("forgot-password")}
                  className="text-xs text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
              <PasswordInput
                id="signin-password"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.loggingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <button
                type="button"
                onClick={() => setAuthView("signup")}
                className="text-primary font-medium hover:underline"
              >
                {t("auth.signUp")}
              </button>
            </p>
          </form>
        )}

        {/* Forgot Password */}
        {authMethod === "email" && authView === "forgot-password" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!forgotPasswordEmail) return;
              
              setLoading(true);
              const { error } = await resetPassword(forgotPasswordEmail);
              
              if (error) {
                toast({
                  title: t("common.error"),
                  description: error.message,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: t("auth.emailSent"),
                  description: t("auth.emailSentDesc"),
                });
                setForgotPasswordEmail("");
                setAuthView("signin");
              }
              setLoading(false);
            }}
            className="space-y-4"
          >
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-lg font-semibold">{t("auth.resetPassword")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.resetPasswordDesc")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t("auth.email")}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !forgotPasswordEmail}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.sending")}
                </>
              ) : (
                t("auth.sendResetLink")
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setAuthView("signin")}
                className="text-primary font-medium hover:underline"
              >
                ← {t("auth.backToLogin")}
              </button>
            </p>
          </form>
        )}

        {/* Email Auth - Sign Up */}
        {authMethod === "email" && authView === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t("auth.email")}</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-username">{t("auth.username")}</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="username"
                value={signUpUsername}
                onChange={(e) => setSignUpUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">{t("auth.password")}</Label>
              <PasswordInput
                id="signup-password"
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                disabled={loading}
              />
              <PasswordStrengthIndicator password={signUpPassword} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.registering")}
                </>
              ) : (
                t("auth.signUp")
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => setAuthView("signin")}
                className="text-primary font-medium hover:underline"
              >
                {t("auth.signIn")}
              </button>
            </p>
          </form>
        )}

        {/* Social Login Section */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t("auth.continueWith")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.redirectingTo")}
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("auth.signInWithGoogle")}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.redirectingTo")}
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {t("auth.signInWithFacebook")}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleTelegramSignIn}
            disabled={loading}
            className="w-full"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="#0088CC">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t("auth.signInWithTelegram")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
