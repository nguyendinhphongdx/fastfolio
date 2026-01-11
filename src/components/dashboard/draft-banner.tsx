import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface DraftBannerProps {
  username: string
}

export function DraftBanner({ username }: DraftBannerProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="pt-6 text-center">
        <h3 className="text-xl font-bold mb-2">Portfolio in Draft Mode</h3>
        <p className="text-muted-foreground mb-4">
          Your portfolio is not published yet. Publish to make it accessible to
          everyone.
        </p>
        <Link href={`/${username}`} target="_blank">
          <Button variant="outline">
            Try it <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
