"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Loader2,
  Check,
  X,
  ExternalLink,
  Key,
  Bot,
  Sparkles,
  Lock,
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

interface LLMSettings {
  provider: string
  model: string | null
  hasApiKey: boolean
  maskedApiKey: string | null
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null)
  const [isPro, setIsPro] = useState(false)

  const [settings, setSettings] = useState<LLMSettings | null>(null)
  const [providers, setProviders] = useState<ProviderInfo[]>([])

  const [selectedProvider, setSelectedProvider] = useState("SYSTEM")
  const [selectedModel, setSelectedModel] = useState("")
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/llm")

      if (res.status === 403) {
        setIsPro(false)
        setIsLoading(false)
        return
      }

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setProviders(data.providers)
        setSelectedProvider(data.settings.provider)
        setSelectedModel(data.settings.model || "")
        setIsPro(true)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTestApiKey() {
    if (!apiKey || selectedProvider === "SYSTEM") return

    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/settings/llm", {
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
    } catch (error) {
      toast.error("Failed to test API key")
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)

    try {
      const res = await fetch("/api/settings/llm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: selectedProvider === "SYSTEM" ? null : apiKey,
          model: selectedModel || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save settings")
      }

      const data = await res.json()
      setSettings(data.settings)
      setApiKey("")
      toast.success("Settings saved successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const currentProvider = providers.find((p) => p.id === selectedProvider)
  const availableModels = currentProvider?.models || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your portfolio settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              PRO Feature
            </CardTitle>
            <CardDescription>
              Custom LLM settings are available for PRO users only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to PRO to use your own AI provider and API keys. Choose from OpenAI,
                Anthropic (Claude), or Google (Gemini) to power your portfolio&apos;s chat.
              </p>
              <Link href="/billing">
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to PRO
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your portfolio settings</p>
      </div>

      {/* LLM Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Provider Configuration
            <Badge variant="secondary">PRO</Badge>
          </CardTitle>
          <CardDescription>
            Choose which AI provider powers your portfolio&apos;s chat. Use your own API key for
            more control and higher limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {settings && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Currently using: <strong>{settings.provider}</strong>
                {settings.model && ` (${settings.model})`}
                {settings.hasApiKey && (
                  <span className="ml-2 text-muted-foreground">
                    Key: {settings.maskedApiKey}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex flex-col">
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProvider && (
              <p className="text-sm text-muted-foreground">{currentProvider.description}</p>
            )}
          </div>

          {/* API Key Input (if not SYSTEM) */}
          {selectedProvider !== "SYSTEM" && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${currentProvider?.name} API key`}
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
                  Get API key
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {testResult && !testResult.valid && (
                <p className="text-sm text-destructive">{testResult.error}</p>
              )}
            </div>
          )}

          {/* Model Selection (if not SYSTEM) */}
          {selectedProvider !== "SYSTEM" && availableModels.length > 0 && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        {model.description && (
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Pricing Info */}
      {selectedProvider !== "SYSTEM" && availableModels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Models</CardTitle>
            <CardDescription>
              Pricing is per 1 million tokens. Your costs depend on your API key usage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{model.name}</p>
                    {model.description && (
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Context: {(model.contextWindow / 1000).toFixed(0)}K tokens
                    </p>
                  </div>
                  {model.inputPricePerMillion && model.outputPricePerMillion && (
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        Input: ${model.inputPricePerMillion}/M
                      </p>
                      <p className="text-muted-foreground">
                        Output: ${model.outputPricePerMillion}/M
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
