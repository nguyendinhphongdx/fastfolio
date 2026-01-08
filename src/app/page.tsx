import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageSquare,
  Sparkles,
  BarChart3,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-lg">Fastfolio</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-purple-600 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-400 to-pink-600 border-2 border-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">8,000+</strong> messages exchanged
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-3xl mx-auto">
            Turn yourself into <span className="gradient-text">ChatGPT</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Let visitors talk to your AI twin on your own domain
          </p>

          {/* Claim Username */}
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <span className="text-muted-foreground text-sm">fastfol.io/</span>
              <Input
                placeholder="your-name"
                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
            <Link href="/signup">
              <Button size="icon" className="rounded-full h-10 w-10">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why choose Fastfolio?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Chat</h3>
                <p className="text-muted-foreground">
                  Your portfolio answers questions 24/7. Recruiters get instant
                  responses about your experience, skills, and projects.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Beautiful Design</h3>
                <p className="text-muted-foreground">
                  Interactive fluid backgrounds, smooth animations, and a
                  stunning design that makes you stand out.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Analytics</h3>
                <p className="text-muted-foreground">
                  Know what recruiters are asking about. Get insights into
                  visitor interests and conversation topics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Get started in 3 steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Account</h3>
              <p className="text-muted-foreground text-sm">
                Sign up with Google, GitHub, or email
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Add Your Info</h3>
              <p className="text-muted-foreground text-sm">
                Import from LinkedIn or add manually
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Share & Track</h3>
              <p className="text-muted-foreground text-sm">
                Share your link and watch the magic happen
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mb-12">
            Start free, upgrade when you need more
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Free</h3>
                <div className="text-3xl font-bold mb-4">$0</div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    10 AI chats/day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Basic analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Custom username
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-primary relative">
              <CardContent className="pt-6">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Popular
                </span>
                <h3 className="font-semibold text-lg mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-4">
                  $8<span className="text-base font-normal">/mo</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    100 AI chats/day
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">Upgrade to Pro</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Lifetime */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Lifetime</h3>
                <div className="text-3xl font-bold mb-4">$49</div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited AI chats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    All Pro features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    One-time payment
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Get Lifetime
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to stand out?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your AI portfolio in minutes
          </p>
          <Link href="/signup">
            <Button size="lg">
              <Zap className="mr-2 h-4 w-4" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">F</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 FastFolio
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
