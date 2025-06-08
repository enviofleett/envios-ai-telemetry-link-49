
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Lock, Check, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client'
import Loading from '@/components/Loading'

interface PasswordSetupPageProps {
  username: string
  email?: string
  onPasswordSetupSuccess?: () => void
}

export default function PasswordSetupPage({
  username,
  email = "",
  onPasswordSetupSuccess,
}: PasswordSetupPageProps) {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }

    score = Object.values(checks).filter(Boolean).length
    return { score, checks }
  }

  const { score, checks } = calculatePasswordStrength(password)
  const strength = (score / 5) * 100

  const getStrengthLabel = () => {
    if (score <= 2) return { label: "Weak", color: "text-red-500" }
    if (score <= 3) return { label: "Fair", color: "text-yellow-500" }
    if (score <= 4) return { label: "Good", color: "text-blue-500" }
    return { label: "Strong", color: "text-green-500" }
  }

  const strengthInfo = getStrengthLabel()

  // Handle password creation
  const handleCreatePassword = async () => {
    if (score < 3) {
      toast({
        title: "Password Too Weak",
        description: "Please create a stronger password",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      })
      return
    }

    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter your username and new password",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true)

    try {
      const response = await supabase.functions.invoke('set-initial-password', {
        body: {
          username: username.trim(),
          newPassword: password
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to set password');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Password Created Successfully",
        description: "Your account is now ready to use",
      })

      // Call the success callback if provided
      if (onPasswordSetupSuccess) {
        setTimeout(() => {
          onPasswordSetupSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Password creation failed:', error);
      toast({
        title: "Failed to Create Password",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return <Loading variant="fullscreen" message="Setting up your password..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle>Set Up Your Password</CardTitle>
          <CardDescription>
            Create a secure password for your account
            <br />
            <strong>Username: {username}</strong>
            {email && (
              <>
                <br />
                <strong>Email: {email}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isCreating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isCreating}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Password Strength */}
          {password && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Password Strength</span>
                <span className={`text-sm font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span>
              </div>
              <Progress value={strength} className="h-2" />

              {/* Password Requirements */}
              <div className="space-y-1 text-sm">
                <div
                  className={`flex items-center gap-2 ${checks.length ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center gap-2 ${checks.uppercase ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One uppercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${checks.lowercase ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One lowercase letter
                </div>
                <div
                  className={`flex items-center gap-2 ${checks.numbers ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {checks.numbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One number
                </div>
                <div
                  className={`flex items-center gap-2 ${checks.special ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  One special character
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isCreating}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isCreating}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Create Password Button */}
          <Button
            onClick={handleCreatePassword}
            disabled={isCreating || score < 3 || password !== confirmPassword || !password}
            className="w-full"
          >
            {isCreating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Password...
              </>
            ) : (
              "Create Password"
            )}
          </Button>

          {/* Security Notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your password will be validated against your GP51 account to ensure compatibility. Make sure to remember it as it cannot be recovered.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
