import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import { EmptyState } from "@/components/shared"

interface Question {
  id: string
  content: string
  createdAt: Date
}

interface RecentQuestionsProps {
  questions: Question[]
}

export function RecentQuestions({ questions }: RecentQuestionsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4">Recent Visitor Questions</h3>
        {questions.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No questions yet"
            description="Share your portfolio to start receiving visitor questions"
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <div
                key={question.id}
                className="p-3 bg-muted/50 rounded-lg text-sm"
              >
                {question.content}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
