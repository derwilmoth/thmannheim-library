"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { BookCard } from "@/components/book-card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { Search, Loader2 } from "lucide-react"
import type { BookWithLoan } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function BooksContent() {
  const [books, setBooks] = useState<BookWithLoan[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/books?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setBooks(data.books || [])
    } catch {
      toast({
        title: "Fehler",
        description: "Bücher konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBooks()
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchBooks])

  const handleBorrow = async (bookId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      toast({
        title: "Erfolgreich",
        description: "Buch wurde ausgeliehen",
      })
      fetchBooks()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ausleihe fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturn = async (loanId: string) => {
    setActionLoading(true)
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
      fetchBooks()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Rückgabe fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Buchkatalog</h1>
          <p className="text-muted-foreground">Durchsuchen Sie unsere Bibliothek und leihen Sie Bücher aus.</p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Suche nach Titel, Autor oder ISBN..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? "Keine Bücher gefunden" : "Noch keine Bücher im Katalog"}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onBorrow={handleBorrow}
                onReturn={handleReturn}
                isAuthenticated={!!user}
                isLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
