import { SignupForm } from "@/components/auth/signup-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SignupPage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return <SignupForm />
}
