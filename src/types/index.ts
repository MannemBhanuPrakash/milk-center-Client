export interface User {
  id: string
  name: string
  phoneNumber: string
  address: string
  createdAt: Date
  isActive?: boolean
  deactivatedAt?: string
  deactivationReason?: string
}

export interface Collection {
  id: string
  userId: string
  userName: string
  date: string
  time: string
  liters: number
  fatPercentage: number
  rate: number
  amount: number
  isManuallyEdited?: boolean
}

export interface Advance {
  id: string
  userId: string
  userName: string
  amount: number
  date: string // ISO datetime string (e.g., "2024-01-15T14:30:00.000Z")
  description: string
}

export interface FatRate {
  fatPercentage: number
  rate: number
}

export interface AuthUser {
  username: string
  role: "admin" | "user" | "helper"
}

export interface Helper {
  id: string
  name: string
  username: string
  phoneNumber: string
  isActive: boolean
  passwordExpiresAt: string
  createdAt: string
  updatedAt: string
  createdBy?: {
    username: string
  }
}
