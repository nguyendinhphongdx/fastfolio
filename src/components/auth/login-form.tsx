"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OAuthButtons, AuthDivider, PasswordInput, ErrorAlert } from "@/components/shared"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  async function handleOAuthSignIn(provider: "google" | "github") {
    setIsLoading(true)
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <div className="space-y-3">
        {/* OAuth Buttons */}
        <OAuthButtons
          onSignIn={handleOAuthSignIn}
          disabled={isLoading}
          mode="signin"
        />

        <AuthDivider />

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Link
                href="/reset-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              required
              disabled={isLoading}
              className="h-9"
            />
          </div>

          <Button type="submit" className="w-full h-9 text-sm" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground pt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
