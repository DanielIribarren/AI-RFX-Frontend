"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Building2, Phone, Calendar, CheckCircle, Loader2, Edit2, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/lib/authService"
import { useToast } from "@/hooks/use-toast"
import { CreditsUsageCard } from "@/components/credits/CreditsUsageCard"
import { useCredits } from "@/contexts/CreditsContext"

export default function ProfilePage() {
  const { user, loading, isAuthenticated, updateUser } = useAuth()
  const { credits } = useCredits()
  const router = useRouter()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    phone: "",
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        company_name: user.company_name || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUser(formData)
      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and personal information
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Your avatar and basic info</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src="" alt={user.full_name} />
              <AvatarFallback className="bg-primary text-background text-3xl font-medium">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge
              variant={user.status === "active" ? "default" : "secondary"}
              className={
                user.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : ""
              }
            >
              {user.status === "active" ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </>
              ) : (
                user.status
              )}
            </Badge>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 pl-6">{user.full_name}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <div className="flex items-center gap-2 pl-6">
                  <p className="text-sm text-gray-900">{user.email}</p>
                  {user.email_verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Company Name
                </Label>
                {isEditing ? (
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Enter your company name"
                  />
                ) : (
                  <p className="text-sm text-gray-900 pl-6">
                    {user.company_name || "Not provided"}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-sm text-gray-900 pl-6">
                    {user.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Account Information</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Member since</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last login</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(user.last_login_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {credits?.plan_tier || 'Free'}
                </Badge>
                <div>
                  <p className="font-medium">
                    {credits?.plan_tier === 'free' && 'Free Plan'}
                    {credits?.plan_tier === 'starter' && 'Starter Plan'}
                    {credits?.plan_tier === 'pro' && 'Pro Plan'}
                    {credits?.plan_tier === 'enterprise' && 'Enterprise Plan'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {credits?.plan_tier === 'free' && 'Basic features'}
                    {credits?.plan_tier === 'starter' && '$29/month'}
                    {credits?.plan_tier === 'pro' && '$99/month'}
                    {credits?.plan_tier === 'enterprise' && 'Custom pricing'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push('/plans')}
              >
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credits Usage Card */}
        <div className="md:col-span-3">
          {credits && (
            <CreditsUsageCard
              creditsTotal={credits.credits_total}
              creditsUsed={credits.credits_used}
              resetDate={credits.reset_date}
              planName={credits.plan_tier}
            />
          )}
        </div>
      </div>
    </div>
  )
}
