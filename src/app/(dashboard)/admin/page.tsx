"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plan } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Loader2,
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Bot,
  Key,
  ExternalLink,
  Check,
  X,
  Settings2,
} from "lucide-react"
import Link from "next/link"

interface LLMModel {
  id: string
  name: string
  description?: string
  contextWindow: number
  inputPricePerMillion?: number
  outputPricePerMillion?: number
}

interface ProviderInfo {
  id: string
  name: string
  description: string
  apiKeyPrefix: string
  docsUrl: string
  models: LLMModel[]
}

interface SystemSettings {
  defaultProvider: string
  defaultModel: string
  hasApiKey: boolean
  maskedApiKey: string | null
  maxMessagesPerMinute: number
  maxTokensPerRequest: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState<Plan | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = loading, true/false = checked

  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [selectedProvider, setSelectedProvider] = useState("OPENAI")
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini")
  const [apiKey, setApiKey] = useState("")
  const [maxMessagesPerMinute, setMaxMessagesPerMinute] = useState(20)
  const [maxTokensPerRequest, setMaxTokensPerRequest] = useState(500)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null)

  const fetchSystemSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setSystemSettings(data.settings)
        setProviders(data.providers)
        setSelectedProvider(data.settings.defaultProvider)
        setSelectedModel(data.settings.defaultModel)
        setMaxMessagesPerMinute(data.settings.maxMessagesPerMinute)
        setMaxTokensPerRequest(data.settings.maxTokensPerRequest)
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error)
    }
  }, [])

  const checkAdminAndFetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/set-plan")
      if (res.status === 403) {
        // Not admin
        setIsAdmin(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(true)
        setCurrentPlan(data.user?.subscription?.plan || "FREE")
        // Also fetch system settings
        fetchSystemSettings()
      } else {
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    }
  }, [fetchSystemSettings])

  useEffect(() => {
    if (status === "authenticated") {
      checkAdminAndFetchPlan()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, checkAdminAndFetchPlan, router])

  async function handleSetPlan(plan: Plan) {
    setLoading(plan)
    setSuccess(null)

    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (data.success) {
        setCurrentPlan(plan)
        setSuccess(`Plan updated to ${plan}!`)
      }
    } catch (error) {
      console.error("Failed to set plan:", error)
    } finally {
      setLoading(null)
    }
  }

  async function handleTestApiKey() {
    if (!apiKey) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
        }),
      })

      const data = await res.json()
      setTestResult(data)

      if (data.valid) {
        toast.success("API key is valid!")
      } else {
        toast.error(data.error || "API key is invalid")
      }
    } catch {
      toast.error("Failed to test API key")
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSaveSettings() {
    setIsSavingSettings(true)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultProvider: selectedProvider,
          defaultModel: selectedModel,
          apiKey: apiKey || undefined,
          maxMessagesPerMinute,
          maxTokensPerRequest,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save settings")
      }

      const data = await res.json()
      setSystemSettings(data.settings)
      setApiKey("")
      setTestResult(null)
      toast.success("System settings saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const currentProvider = providers.find((p) => p.id === selectedProvider)
  const availableModels = currentProvider?.models || []

  // Show loading while checking auth or admin status
  if (status === "loading" || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show access denied for non-admin users
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  const plans: { plan: Plan; icon: typeof Zap; color: string }[] = [
    { plan: "FREE", icon: Zap, color: "bg-gray-100 text-gray-600" },
    { plan: "PRO", icon: Sparkles, color: "bg-blue-100 text-blue-600" },
    { plan: "LIFETIME", icon: Crown, color: "bg-yellow-100 text-yellow-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          System configuration and testing tools
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Bot className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Zap className="h-4 w-4" />
            Plan Switcher
          </TabsTrigger>
        </TabsList>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Default AI Provider
                <Badge variant="outline">System</Badge>
              </CardTitle>
              <CardDescription>
                Configure the default AI provider for users who don&apos;t have their own API key.
                This is used when users select &quot;System Default&quot; as their provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              {systemSettings && (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Current default: <strong>{systemSettings.defaultProvider}</strong>
                    {systemSettings.defaultModel && ` / ${systemSettings.defaultModel}`}
                    {systemSettings.hasApiKey ? (
                      <span className="ml-2 text-green-600">
                        (Key configured: {systemSettings.maskedApiKey})
                      </span>
                    ) : (
                      <span className="ml-2 text-destructive">
                        (No API key configured!)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>Default Provider</Label>
                <Select value={selectedProvider} onValueChange={(value) => {
                  setSelectedProvider(value)
                  // Reset model when provider changes
                  const provider = providers.find(p => p.id === value)
                  if (provider?.models?.length) {
                    setSelectedModel(provider.models[0].id)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentProvider && (
                  <p className="text-sm text-muted-foreground">{currentProvider.description}</p>
                )}
              </div>

              {/* Model Selection */}
              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* API Key Input */}
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={systemSettings?.hasApiKey
                      ? "Enter new key to replace existing..."
                      : `Enter your ${currentProvider?.name} API key`
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestApiKey}
                    disabled={!apiKey || isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : testResult?.valid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : testResult ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
                {currentProvider?.docsUrl && (
                  <Link
                    href={currentProvider.docsUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Get API key from {currentProvider.name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                {testResult && !testResult.valid && (
                  <p className="text-sm text-destructive">{testResult.error}</p>
                )}
              </div>

              <Separator />

              {/* Rate Limiting */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <Label className="text-base font-medium">Rate Limiting</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMessages">Max Messages Per Minute</Label>
                    <Input
                      id="maxMessages"
                      type="number"
                      min={1}
                      max={100}
                      value={maxMessagesPerMinute}
                      onChange={(e) => setMaxMessagesPerMinute(parseInt(e.target.value) || 20)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens Per Request</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min={100}
                      max={4000}
                      value={maxTokensPerRequest}
                      onChange={(e) => setMaxTokensPerRequest(parseInt(e.target.value) || 500)}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save System Settings"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model Pricing Info */}
          {availableModels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Models for {currentProvider?.name}</CardTitle>
                <CardDescription>
                  Pricing is per 1 million tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableModels.map((model) => (
                    <div
                      key={model.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        model.id === selectedModel ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {model.name}
                          {model.id === selectedModel && (
                            <Badge variant="secondary" className="text-xs">Selected</Badge>
                          )}
                        </p>
                        {model.description && (
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        )}
                      </div>
                      {model.inputPricePerMillion && model.outputPricePerMillion && (
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            ${model.inputPricePerMillion}/M in
                          </p>
                          <p className="text-muted-foreground">
                            ${model.outputPricePerMillion}/M out
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plan Switcher Tab */}
        <TabsContent value="plan" className="space-y-6">
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {session?.user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan && (
                <Badge
                  variant="outline"
                  className={
                    currentPlan === "PRO"
                      ? "bg-blue-100 text-blue-700"
                      : currentPlan === "LIFETIME"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  {currentPlan}
                </Badge>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map(({ plan, icon: Icon, color }) => (
              <Card
                key={plan}
                className={currentPlan === plan ? "border-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {plan}
                  </CardTitle>
                  <CardDescription>
                    {plan === "FREE" && "Basic features"}
                    {plan === "PRO" && "All premium features"}
                    {plan === "LIFETIME" && "Forever access"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleSetPlan(plan)}
                    disabled={loading !== null || currentPlan === plan}
                    variant={currentPlan === plan ? "outline" : "default"}
                    className="w-full"
                  >
                    {loading === plan ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Switching...
                      </>
                    ) : currentPlan === plan ? (
                      "Current"
                    ) : (
                      `Switch to ${plan}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
