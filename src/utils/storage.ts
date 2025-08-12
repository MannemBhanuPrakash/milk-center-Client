import type { User, Collection, Advance, FatRate } from "../types"
import { apiService, ApiError } from "./api"

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiService.getUsers({ limit: 1000 })
    console.log('Users API response:', response)
    return response.data?.users || []
  } catch (error) {
    console.error('Error fetching users:', error)
    console.error('Error details:', error)
    return []
  }
}

export const addUser = async (user: Omit<User, "id" | "createdAt">): Promise<User | { success: false; message: string }> => {
  try {
    const response = await apiService.createUser(user)
    return response.data?.user || null
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof ApiError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: 'Failed to create user' }
  }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<User | { success: false; message: string }> => {
  try {
    const response = await apiService.updateUser(id, updates)
    return response.data?.user || null
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof ApiError) {
      return { success: false, message: error.message }
    }
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }
    return { success: false, message: 'Failed to update user' }
  }
}

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await apiService.deleteUser(id)
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error // Re-throw to allow component-level error handling
  }
}

export const getCollections = async (): Promise<Collection[]> => {
  try {
    const response = await apiService.getCollections({ limit: 1000 })
    console.log('Collections API response:', response)
    return response.data?.collections || []
  } catch (error) {
    console.error('Error fetching collections:', error)
    console.error('Error details:', error)
    return []
  }
}

export const addCollection = async (collection: Omit<Collection, "id">): Promise<Collection | null> => {
  try {
    const response = await apiService.createCollection(collection)
    return response.data?.collection || null
  } catch (error) {
    console.error('Error creating collection:', error)
    throw error // Re-throw to allow component-level error handling
  }
}

export const updateCollection = async (id: string, updates: Partial<Collection>): Promise<Collection | null> => {
  try {
    const response = await apiService.updateCollection(id, updates)
    return response.data?.collection || null
  } catch (error) {
    console.error('Error updating collection:', error)
    throw error // Re-throw to allow component-level error handling
  }
}

export const getAdvances = async (): Promise<Advance[]> => {
  try {
    const response = await apiService.getAdvances()
    return response.data?.advances || []
  } catch (error) {
    console.error('Error fetching advances:', error)
    return []
  }
}

export const addAdvance = async (advance: Omit<Advance, "id">): Promise<Advance | null> => {
  try {
    const response = await apiService.createAdvance(advance)
    return response.data?.advance || null
  } catch (error) {
    console.error('Error creating advance:', error)
    throw error // Re-throw to allow component-level error handling
  }
}

export const getFatRates = async (): Promise<FatRate[]> => {
  try {
    const response = await apiService.getFatRates()
    return response.data?.fatRates || []
  } catch (error) {
    console.error('Error fetching fat rates:', error)
    return []
  }
}

export const saveFatRates = async (rates: FatRate[]): Promise<boolean> => {
  try {
    await apiService.bulkUpdateFatRates(rates)
    return true
  } catch (error) {
    console.error('Error saving fat rates:', error)
    throw error // Re-throw to allow component-level error handling
  }
}

export const saveUsers = (_users: User[]): void => {
  console.warn('saveUsers is deprecated, data is now automatically saved to the database')
}

export const saveCollections = (_collections: Collection[]): void => {
  console.warn('saveCollections is deprecated, data is now automatically saved to the database')
}

export const saveAdvances = (_advances: Advance[]): void => {
  console.warn('saveAdvances is deprecated, data is now automatically saved to the database')
}
