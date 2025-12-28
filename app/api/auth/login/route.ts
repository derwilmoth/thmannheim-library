import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyPassword, createSession, type User } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email und Passwort sind erforderlich" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const user = await db.collection<User>("users").findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 })
    }

    await createSession(user._id.toString())

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen" }, { status: 500 })
  }
}
