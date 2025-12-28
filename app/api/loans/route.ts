import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { bookId } = await request.json()

    if (!bookId) {
      return NextResponse.json({ error: "Buch-ID ist erforderlich" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const book = await db.collection("books").findOne({ _id: new ObjectId(bookId) })
    if (!book) {
      return NextResponse.json({ error: "Buch nicht gefunden" }, { status: 404 })
    }

    if (book.availableCopies <= 0) {
      return NextResponse.json({ error: "Keine Exemplare verfügbar" }, { status: 400 })
    }

    // Check if user already has this book
    const existingLoan = await db.collection("loans").findOne({
      bookId: new ObjectId(bookId),
      userId: new ObjectId(session.id),
      returnedAt: { $exists: false },
    })

    if (existingLoan) {
      return NextResponse.json({ error: "Sie haben dieses Buch bereits ausgeliehen" }, { status: 400 })
    }

    // Create loan
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 28) // 4 weeks loan period

    await db.collection("loans").insertOne({
      bookId: new ObjectId(bookId),
      userId: new ObjectId(session.id),
      borrowedAt: new Date(),
      dueDate,
    })

    // Update book availability
    await db.collection("books").updateOne({ _id: new ObjectId(bookId) }, { $inc: { availableCopies: -1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create loan error:", error)
    return NextResponse.json({ error: "Fehler beim Ausleihen" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const db = await connectToDatabase()

    const loans = await db
      .collection("loans")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(session.id),
            returnedAt: { $exists: false },
          },
        },
        {
          $lookup: {
            from: "books",
            localField: "bookId",
            foreignField: "_id",
            as: "book",
          },
        },
        { $unwind: "$book" },
        { $sort: { dueDate: 1 } },
      ])
      .toArray()

    return NextResponse.json({
      loans: loans.map((loan) => ({
        _id: loan._id.toString(),
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        book: {
          _id: loan.book._id.toString(),
          title: loan.book.title,
          author: loan.book.author,
          isbn: loan.book.isbn,
          coverUrl: loan.book.coverUrl,
        },
      })),
    })
  } catch (error) {
    console.error("Get loans error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Ausleihen" }, { status: 500 })
  }
}
