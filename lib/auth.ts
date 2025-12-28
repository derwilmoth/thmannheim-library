import { cookies } from "next/headers"
import { connectToDatabase } from "./mongodb"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  email: string
  name: string
  password: string
  isAdmin: boolean
  createdAt: Date
}

export interface SessionUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

const SESSION_COOKIE = "library_session"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string): Promise<string> {
  const db = await connectToDatabase()
  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.collection("sessions").insertOne({
    userId: new ObjectId(userId),
    token: sessionToken,
    expiresAt,
    createdAt: new Date(),
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionToken
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionToken) {
    return null
  }

  const db = await connectToDatabase()
  const session = await db.collection("sessions").findOne({
    token: sessionToken,
    expiresAt: { $gt: new Date() },
  })

  if (!session) {
    return null
  }

  const user = await db.collection<User>("users").findOne({
    _id: session.userId,
  })

  if (!user) {
    return null
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin || false,
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionToken) {
    const db = await connectToDatabase()
    await db.collection("sessions").deleteOne({ token: sessionToken })
  }

  cookieStore.delete(SESSION_COOKIE)
}
