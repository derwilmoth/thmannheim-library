import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/test?replicaSet=rs0"

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db
  }

  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }

  db = client.db("library")
  return db
}

export async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}
