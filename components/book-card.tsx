"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, CheckCircle } from "lucide-react"
import type { BookWithLoan } from "@/lib/types"

interface BookCardProps {
  book: BookWithLoan
  onBorrow: (bookId: string) => void
  onReturn: (loanId: string) => void
  isAuthenticated: boolean
  isLoading: boolean
}

export function BookCard({ book, onBorrow, onReturn, isAuthenticated, isLoading }: BookCardProps) {
  const isAvailable = book.availableCopies > 0
  const hasLoan = !!book.loan

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-1 pt-6">
        <div className="flex gap-4">
          <div className="w-20 h-28 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
            {book.coverUrl ? (
              <img
                src={book.coverUrl || "/placeholder.svg"}
                alt={book.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <BookOpen className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">{book.author}</p>
            <p className="text-xs text-muted-foreground mb-2">ISBN: {book.isbn}</p>
            <div className="flex items-center gap-2">
              {isAvailable ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {book.availableCopies} verfügbar
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Nicht verfügbar
                </Badge>
              )}
            </div>
          </div>
        </div>
        {book.description && <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{book.description}</p>}
        {hasLoan && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Von Ihnen ausgeliehen</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>Fällig am {formatDate(book.loan!.dueDate)}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {hasLoan ? (
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => onReturn(book.loan!._id)}
            disabled={isLoading}
          >
            Zurückgeben
          </Button>
        ) : isAuthenticated ? (
          <Button className="w-full" onClick={() => onBorrow(book._id)} disabled={!isAvailable || isLoading}>
            {isAvailable ? "Ausleihen" : "Nicht verfügbar"}
          </Button>
        ) : (
          <Button className="w-full bg-transparent" variant="outline" disabled>
            Anmelden zum Ausleihen
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
