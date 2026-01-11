"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Check,
  X,
  Loader2,
  Play,
  Upload,
  Palette,
  Share2,
  Quote,
  ChevronDown,
} from "lucide-react"

export default function HomePage() {
  const [username, setUsername] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null)
      return
    }

    setIsChecking(true)
    // Simulate API check
    await new Promise(resolve => setTimeout(resolve, 500))
    // For demo, usernames with "taken" are unavailable
    setIsAvailable(!value.toLowerCase().includes("taken"))
    setIsChecking(false)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setUsername(value)
    checkUsername(value)
  }

  const faqs = [
    {
      question: "How does it work?",
      answer: "Simply sign up, add your information (projects, skills, experience), and our AI learns about you. Visitors can then chat with your AI portfolio 24/7."
    },
    {
      question: "Can I customize my AI's responses?",
      answer: "Yes! You can add custom Q&A pairs, set your AI's personality, and control what information it shares."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption and never share your data with third parties."
    },
    {
      question: "Can I use my own domain?",
      answer: "Pro and Lifetime plans support custom domains. You can connect your own domain in the settings."
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-lg">Fastfolio</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 mb-8">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">2,847</strong> portfolios created
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-3xl mx-auto">
            Turn yourself into <span className="gradient-text">ChatGPT</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Let visitors talk to your AI twin on your own link
          </p>

          {/* Username Input */}
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto mb-4">
            <div className="flex-1 flex items-center bg-gray-900 rounded-full px-5 py-3.5 gap-1 border border-gray-800 hover:border-gray-700 transition-colors focus-within:border-gray-600 focus-within:ring-2 focus-within:ring-gray-700/50">
              <span className="text-white text-sm font-medium shrink-0">fastfol.io/</span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="your-name"
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 min-w-0"
              />
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isChecking && (
                  <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                )}
                {!isChecking && isAvailable === true && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {!isChecking && isAvailable === false && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <Link href={`/signup${username ? `?username=${username}` : ""}`}>
              <Button size="icon" className="rounded-full h-12 w-12 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {username && isAvailable === false && (
            <p className="text-sm text-red-500">This username is already taken</p>
          )}
          {username && isAvailable === true && (
            <p className="text-sm text-green-600">Username is available!</p>
          )}
        </div>
      </section>

      {/* Demo Chat Preview */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Chat Demo Card */}
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
              <div className="grid md:grid-cols-2">
                {/* Left - Profile */}
                <div className="p-8 border-r bg-gray-50">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-2xl font-bold">
                      S
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Steve Jobs</h3>
                      <p className="text-sm text-muted-foreground">Co-founder of Apple</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    &quot;Innovation distinguishes between a leader and a follower.&quot;
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Design", "Innovation", "Technology", "Leadership"].map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-200 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Right - Chat */}
                <div className="p-8 flex flex-col">
                  <div className="flex-1 space-y-4 mb-6">
                    <div className="flex justify-end">
                      <div className="bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                        <p className="text-sm">What&apos;s your design philosophy?</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                        <p className="text-sm">Design is not just what it looks like and feels like. Design is how it works. I believe in simplicity...</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                    <input
                      type="text"
                      placeholder="Ask me anything..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      disabled
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden mb-8">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <p className="text-2xl md:text-3xl font-light mb-2">Build your</p>
                <h2 className="text-4xl md:text-6xl font-serif italic">AI Portfolio</h2>
                <button className="mt-8 w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="h-6 w-6 text-white fill-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Minutes Setup */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">5 minutes setup</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No coding required. Just add your information and let AI do the magic.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <Upload className="h-7 w-7 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">1. Import</h3>
              <p className="text-sm text-muted-foreground">
                Upload your resume or import from LinkedIn
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <Palette className="h-7 w-7 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">2. Customize</h3>
              <p className="text-sm text-muted-foreground">
                Edit your profile and customize AI responses
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-7 w-7 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">3. Share</h3>
              <p className="text-sm text-muted-foreground">
                Share your link and start receiving visitors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Be Outstanding */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Be outstanding</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Let recruiters, clients, and collaborators learn about you in a new way
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">HELLO APPLE</p>
                    <p className="text-sm font-medium">Steve Jobs</p>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">24/7 Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Your AI responds to visitors anytime, anywhere in the world
                </p>
              </CardContent>
            </Card>
            {/* Feature 2 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="space-y-2 w-full px-4">
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                    <div className="h-2 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Deep Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Know what visitors are asking and interested in
                </p>
              </CardContent>
            </Card>
            {/* Feature 3 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded bg-gray-200" />
                    <div className="w-8 h-8 rounded bg-gray-300" />
                    <div className="w-8 h-8 rounded bg-gray-400" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Beautiful Design</h3>
                <p className="text-sm text-muted-foreground">
                  Stunning fluid animations that make you stand out
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by professionals worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Product Designer",
                quote: "This completely changed how I present myself to potential clients. The AI handles initial conversations perfectly."
              },
              {
                name: "Marcus Johnson",
                role: "Software Engineer",
                quote: "Recruiters love it! They can learn about my experience without scheduling a call first."
              },
              {
                name: "Emily Park",
                role: "Freelance Writer",
                quote: "Setup took 10 minutes. Now my portfolio works for me 24/7. Best investment for my career."
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-gray-200 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to stand out?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join thousands of professionals who let their AI portfolio work for them
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full bg-white text-gray-900 hover:bg-gray-100">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 Fastfolio
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
