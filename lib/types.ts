import type { ObjectId } from "mongodb"

export interface Book {
  _id: ObjectId
  title: string
  author: string
  isbn: string
  description: string
  coverUrl?: string
  totalCopies: number
  availableCopies: number
  createdAt: Date
  updatedAt: Date
}

export interface Loan {
  _id: ObjectId
  bookId: ObjectId
  userId: ObjectId
  borrowedAt: Date
  dueDate: Date
  returnedAt?: Date
}

export interface BookWithLoan extends Omit<Book, "_id"> {
  _id: string
  loan?: {
    _id: string
    borrowedAt: string
    dueDate: string
  }
}
