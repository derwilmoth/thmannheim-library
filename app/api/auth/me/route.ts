import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ error: "Sitzungsfehler" }, { status: 500 })
  }
}
