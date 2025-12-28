import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Book } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const db = await connectToDatabase()
    const session = await getSession()

    const query: Record<string, unknown> = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ]
    }

    const books = await db.collection<Book>("books").find(query).sort({ title: 1 }).toArray()

    // Get user's current loans if authenticated
    let userLoans: Record<string, { _id: string; borrowedAt: Date; dueDate: Date }> = {}
    if (session) {
      const loans = await db
        .collection("loans")
        .find({
          userId: new ObjectId(session.id),
          returnedAt: { $exists: false },
        })
        .toArray()

      userLoans = loans.reduce(
        (acc, loan) => {
          acc[loan.bookId.toString()] = {
            _id: loan._id.toString(),
            borrowedAt: loan.borrowedAt,
            dueDate: loan.dueDate,
          }
          return acc
        },
        {} as Record<string, { _id: string; borrowedAt: Date; dueDate: Date }>,
      )
    }

    const booksWithLoans = books.map((book) => ({
      ...book,
      _id: book._id.toString(),
      loan: userLoans[book._id.toString()] || null,
    }))

    return NextResponse.json({ books: booksWithLoans })
  } catch (error) {
    console.error("Get books error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Bücher" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const { title, author, isbn, description, coverUrl, totalCopies } = await request.json()

    if (!title || !author || !isbn) {
      return NextResponse.json({ error: "Titel, Autor und ISBN sind erforderlich" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const existingBook = await db.collection("books").findOne({ isbn })
    if (existingBook) {
      return NextResponse.json({ error: "Ein Buch mit dieser ISBN existiert bereits" }, { status: 400 })
    }

    const result = await db.collection("books").insertOne({
      title,
      author,
      isbn,
      description: description || "",
      coverUrl: coverUrl || "",
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Create book error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen des Buchs" }, { status: 500 })
  }
}
