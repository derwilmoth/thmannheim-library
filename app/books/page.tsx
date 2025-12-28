import { Suspense } from "react"
import { BooksContent } from "@/components/books-content"
import { Loader2 } from "lucide-react"

function BooksLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function BooksPage() {
  return (
    <Suspense fallback={<BooksLoading />}>
      <BooksContent />
    </Suspense>
  )
}
