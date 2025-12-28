import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const db = await connectToDatabase()

    const loan = await db.collection("loans").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.id),
      returnedAt: { $exists: false },
    })

    if (!loan) {
      return NextResponse.json({ error: "Ausleihe nicht gefunden" }, { status: 404 })
    }

    // Mark as returned
    await db.collection("loans").updateOne({ _id: new ObjectId(id) }, { $set: { returnedAt: new Date() } })

    // Update book availability
    await db.collection("books").updateOne({ _id: loan.bookId }, { $inc: { availableCopies: 1 } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Return loan error:", error)
    return NextResponse.json({ error: "Fehler beim Zurückgeben" }, { status: 500 })
  }
}
