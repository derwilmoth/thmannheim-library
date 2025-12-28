import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    const db = await connectToDatabase()

    // Check for active loans
    const activeLoans = await db.collection("loans").findOne({
      bookId: new ObjectId(id),
      returnedAt: { $exists: false },
    })

    if (activeLoans) {
      return NextResponse.json({ error: "Buch kann nicht gelöscht werden, da es ausgeliehen ist" }, { status: 400 })
    }

    await db.collection("books").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete book error:", error)
    return NextResponse.json({ error: "Fehler beim Löschen des Buchs" }, { status: 500 })
  }
}
