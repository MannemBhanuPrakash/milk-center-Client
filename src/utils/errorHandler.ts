import { ValidationError, ApiErrorResponse } from '../contexts/AlertContext'
import { ApiError } from './api'

export interface ErrorHandlerOptions {
  showAlert?: boolean
  logError?: boolean
  fallbackMessage?: string
  context?: string
}

export interface ParsedError {
  message: string
  validationErrors?: ValidationError[]
  statusCode?: number
  type: 'validation' | 'network' | 'auth' | 'server' | 'client' | 'unknown'
  context?: string
}

export class ErrorHandler {
  static parseError(error: any, options: ErrorHandlerOptions = {}): ParsedError {
    const {
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      context
    } = options

    if (logError) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    }

    if (error instanceof ApiError) {
      const result: ParsedError = {
        message: error.message,
        statusCode: error.status,
        type: this.getErrorTypeFromStatus(error.status),
        context
      }

      if (error.response?.errors && Array.isArray(error.response.errors)) {
        return {
          ...result,
          type: 'validation',
          validationErrors: error.response.errors.map((err: any) => ({
            field: this.formatFieldName(err.path || err.param || err.field || 'unknown'),
            message: err.msg || err.message || 'Invalid value',
            type: this.getValidationErrorType(err)
          }))
        }
      }

      return result
    }

    if (error?.response?.data) {
      const data = error.response.data
      if (data.errors && Array.isArray(data.errors)) {
        return {
          message: data.message || 'Validation failed',
          validationErrors: data.errors.map((err: any) => ({
            field: this.formatFieldName(err.field || err.path || err.param || 'unknown'),
            message: err.message || err.msg || 'Invalid value',
            type: this.getValidationErrorType(err)
          })),
          statusCode: error.response?.status || 400,
          type: 'validation',
          context
        }
      }

      return {
        message: data.message || fallbackMessage,
        statusCode: error.response?.status || 500,
        type: this.getErrorTypeFromStatus(error.response?.status || 500),
        context
      }
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        statusCode: 0,
        type: 'network',
        context
      }
    }

    if (error.name === 'AbortError') {
      return {
        message: 'Request timed out. Please try again.',
        statusCode: 408,
        type: 'network',
        context
      }
    }

    return {
      message: error.message || fallbackMessage,
      statusCode: error.status || 500,
      type: 'unknown',
      context
    }
  }

  static handleApiError(
    error: any,
    options: ErrorHandlerOptions = {}
  ): {
    message: string
    validationErrors?: ValidationError[]
    statusCode?: number
    type?: string
  } {
    const parsed = this.parseError(error, options)
    return {
      message: parsed.message,
      validationErrors: parsed.validationErrors,
      statusCode: parsed.statusCode,
      type: parsed.type
    }
  }

  static handleLoginError(error: any): {
    message: string
    title: string
    statusCode?: number
  } {
    const parsed = this.parseError(error, { context: 'login' })

    let message = "Login failed. Please try again."
    let title = "Login Failed"

    switch (parsed.statusCode) {
      case 401:
        message = parsed.message || "Invalid username or password. Please check your credentials."
        title = "Authentication Failed"
        break
      case 403:
        message = parsed.message || "Access denied. Your account may be deactivated."
        title = "Access Denied"
        break
      case 429:
        message = parsed.message || "Too many login attempts. Please try again later."
        title = "Rate Limited"
        break
      case 500:
        message = "Server error occurred. Please try again later or contact support."
        title = "Server Error"
        break
      case 0:
        message = "Network error. Please check your internet connection and try again."
        title = "Connection Failed"
        break
      default:
        message = parsed.message || message
        break
    }

    return {
      message,
      title,
      statusCode: parsed.statusCode
    }
  }

  private static getErrorTypeFromStatus(status: number): ParsedError['type'] {
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) return 'auth'
      if (status === 422 || status === 400) return 'validation'
      return 'client'
    }
    if (status >= 500) return 'server'
    if (status === 0) return 'network'
    return 'unknown'
  }

  private static getValidationErrorType(error: any): ValidationError['type'] {
    if (error.type) return error.type
    if (error.msg?.includes('required') || error.message?.includes('required')) return 'required'
    if (error.msg?.includes('format') || error.message?.includes('format')) return 'format'
    if (error.msg?.includes('range') || error.message?.includes('between')) return 'range'
    return 'custom'
  }

  private static formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  static getErrorMessage(error: any): string {
    if (error instanceof ApiError) {
      return error.message
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network error. Please check your connection.'
    }

    if (error.name === 'AbortError') {
      return 'Request timed out. Please try again.'
    }

    return error.message || 'An unexpected error occurred'
  }

  static isValidationError(error: any): boolean {
    return error instanceof ApiError &&
      error.status === 400 &&
      error.response?.validationErrors
  }

  static isNetworkError(error: any): boolean {
    return error.name === 'TypeError' && error.message.includes('fetch')
  }

  static isAuthError(error: any): boolean {
    return error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
  }

  static isAccessDeniedError(error: any): boolean {
    return error instanceof ApiError &&
      error.status === 403 &&
      error.response?.accessDenied === true
  }

  static isServerError(error: any): boolean {
    return error instanceof ApiError &&
      error.status >= 500
  }
}

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  options: {
    onError?: (parsedError: ParsedError) => void
    showAlert?: boolean
    context?: string
    fallbackMessage?: string
  } = {}
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    const parsedError = ErrorHandler.parseError(error, {
      context: options.context,
      fallbackMessage: options.fallbackMessage
    })

    if (options.onError) {
      options.onError(parsedError)
    } else {
      console.error('Unhandled error:', parsedError)
    }
    return null
  }
}

export const createApiErrorResponse = (
  message: string,
  statusCode: number = 500,
  errors?: ValidationError[]
): ApiErrorResponse => ({
  success: false,
  message,
  statusCode,
  errors
})

export const isValidationError = (error: any): boolean => {
  const parsed = ErrorHandler.parseError(error, { logError: false })
  return parsed.type === 'validation'
}

export const isNetworkError = (error: any): boolean => {
  const parsed = ErrorHandler.parseError(error, { logError: false })
  return parsed.type === 'network'
}

export const isAuthError = (error: any): boolean => {
  const parsed = ErrorHandler.parseError(error, { logError: false })
  return parsed.type === 'auth'
}

export const isAccessDeniedError = (error: any): boolean => {
  const parsed = ErrorHandler.parseError(error, { logError: false })
  return parsed.type === 'auth' &&
    error instanceof ApiError &&
    error.status === 403 &&
    error.response?.accessDenied === true
}

export const isServerError = (error: any): boolean => {
  const parsed = ErrorHandler.parseError(error, { logError: false })
  return parsed.type === 'server'
}