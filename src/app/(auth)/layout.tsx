import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold text-lg">FastFolio</span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Right side - Showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-gray-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo icon */}
          <div className="mb-8 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-3xl">F</span>
            </div>
          </div>

          {/* Brand name */}
          <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 tracking-tight">
            Fast<span className="text-gray-400">Folio</span>
          </h1>

          {/* Mock chat input */}
          <div className="bg-gray-800/50 backdrop-blur rounded-full px-6 py-4 flex items-center gap-3 mb-8 border border-gray-700/50">
            <span className="text-gray-400 text-sm flex-1 text-left">Ask me anything...</span>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Tagline */}
          <p className="text-gray-400 text-lg">
            Conversational portfolio that answers<br />
            questions about you 24/7
          </p>

          {/* Stats or social proof */}
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">2,847</p>
              <p className="text-sm text-gray-500">Portfolios</p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-sm text-gray-500">Conversations</p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.9</p>
              <p className="text-sm text-gray-500">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
