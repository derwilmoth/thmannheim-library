"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { BookOpen, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Loan {
  _id: string
  borrowedAt: string
  dueDate: string
  book: {
    _id: string
    title: string
    author: string
    isbn: string
    coverUrl?: string
  }
}

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const fetchLoans = useCallback(async () => {
    try {
      const res = await fetch("/api/loans")
      if (res.ok) {
        const data = await res.json()
        setLoans(data.loans || [])
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Ausleihen konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchLoans()
    }
  }, [user, authLoading, router, fetchLoans])

  const handleReturn = async (loanId: string) => {
    setActionLoading(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/return`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      toast({
        title: "Erfolgreich",
        description: "Buch wurde zurückgegeben",
      })
      fetchLoans()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Rückgabe fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const isOverdue = (dueDateString: string) => {
    return new Date(dueDateString) < new Date()
  }

  const getDaysRemaining = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meine Ausleihen</h1>
          <p className="text-muted-foreground">Übersicht über Ihre aktuell ausgeliehenen Bücher.</p>
        </div>

        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Sie haben aktuell keine Bücher ausgeliehen.</p>
              <Button className="mt-4" onClick={() => router.push("/books")}>
                Zum Katalog
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const overdue = isOverdue(loan.dueDate)
              const daysRemaining = getDaysRemaining(loan.dueDate)

              return (
                <Card key={loan._id} className={overdue ? "border-red-300" : ""}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-16 h-24 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                        {loan.book.coverUrl ? (
                          <img
                            src={loan.book.coverUrl || "/placeholder.svg"}
                            alt={loan.book.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{loan.book.title}</h3>
                        <p className="text-muted-foreground">{loan.book.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">ISBN: {loan.book.isbn}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Ausgeliehen am {formatDate(loan.borrowedAt)}</span>
                          </div>
                          {overdue ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Überfällig seit {Math.abs(daysRemaining)} Tagen
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {daysRemaining === 0
                                ? "Heute fällig"
                                : daysRemaining === 1
                                  ? "Morgen fällig"
                                  : `Noch ${daysRemaining} Tage`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center gap-2">
                        <Button
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => handleReturn(loan._id)}
                          disabled={actionLoading === loan._id}
                        >
                          {actionLoading === loan._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zurückgeben"}
                        </Button>
                        <p className="text-xs text-muted-foreground">Fällig: {formatDate(loan.dueDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
