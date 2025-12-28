"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Plus, Trash2, BookOpen, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Book {
  _id: string
  title: string
  author: string
  isbn: string
  description: string
  totalCopies: number
  availableCopies: number
}

export default function AdminPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverUrl: "",
    totalCopies: "1",
  })

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books")
      if (res.ok) {
        const data = await res.json()
        setBooks(data.books || [])
      }
    } catch {
      toast({
        title: "Fehler",
        description: "Bücher konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (!user.isAdmin) {
        router.push("/books")
        toast({
          title: "Keine Berechtigung",
          description: "Sie haben keine Administrator-Rechte",
          variant: "destructive",
        })
      } else {
        fetchBooks()
      }
    }
  }, [user, authLoading, router, toast, fetchBooks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalCopies: Number.parseInt(formData.totalCopies) || 1,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }

      toast({
        title: "Erfolgreich",
        description: "Buch wurde hinzugefügt",
      })
      setDialogOpen(false)
      setFormData({
        title: "",
        author: "",
        isbn: "",
        description: "",
        coverUrl: "",
        totalCopies: "1",
      })
      fetchBooks()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Buch konnte nicht hinzugefügt werden",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (bookId: string) => {
    setDeleteLoading(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }

      toast({
        title: "Erfolgreich",
        description: "Buch wurde gelöscht",
      })
      fetchBooks()
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Buch konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Buchverwaltung</h1>
            <p className="text-muted-foreground">Bücher hinzufügen und verwalten.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buch hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neues Buch hinzufügen</DialogTitle>
                <DialogDescription>Fügen Sie ein neues Buch zum Katalog hinzu.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN *</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverUrl">Cover-URL</Label>
                    <Input
                      id="coverUrl"
                      type="url"
                      value={formData.coverUrl}
                      onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCopies">Anzahl Exemplare</Label>
                    <Input
                      id="totalCopies"
                      type="number"
                      min="1"
                      value={formData.totalCopies}
                      onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="bg-transparent"
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Hinzufügen
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Alle Bücher ({books.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {books.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Bücher vorhanden. Fügen Sie das erste Buch hinzu.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead className="text-center">Verfügbar</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book._id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell className="font-mono text-sm">{book.isbn}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={book.availableCopies > 0 ? "secondary" : "destructive"}>
                            {book.availableCopies} / {book.totalCopies}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deleteLoading === book._id}
                              >
                                {deleteLoading === book._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Buch löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchten Sie &quot;{book.title}&quot; wirklich löschen? Diese Aktion kann nicht
                                  rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(book._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Admin-Rechte vergeben</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Um einem Benutzer Admin-Rechte zu geben, muss direkt in der MongoDB-Datenbank das Feld{" "}
              <code className="bg-muted px-1 py-0.5 rounded">isAdmin</code> auf{" "}
              <code className="bg-muted px-1 py-0.5 rounded">true</code> gesetzt werden.
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 font-mono text-sm overflow-x-auto">
              <pre>
                {`db.users.updateOne(
  { email: "admin@hs-mannheim.de" },
  { $set: { isAdmin: true } }
)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
