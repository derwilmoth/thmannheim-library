import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, Passwort und Name sind erforderlich" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Passwort muss mindestens 6 Zeichen lang sein" }, { status: 400 })
    }

    const db = await connectToDatabase()

    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Ein Benutzer mit dieser Email existiert bereits" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      isAdmin: false,
      createdAt: new Date(),
    })

    await createSession(result.insertedId.toString())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 })
  }
}
