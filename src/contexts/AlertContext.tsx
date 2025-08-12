import React, { createContext, useContext, useState, useCallback } from 'react'

// Global alert configuration
export const ALERT_DURATION = 5000 // 5 seconds - change this to modify all alert durations

export interface Alert {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: AlertAction[]
  dismissible?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
}

export interface AlertAction {
  label: string
  onClick: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

export interface ValidationError {
  field: string
  message: string
  type?: 'required' | 'format' | 'range' | 'custom'
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: ValidationError[]
  statusCode?: number
  details?: any
}

interface AlertContextType {
  alerts: Alert[]
  showAlert: (alert: Omit<Alert, 'id'>) => string
  showSuccess: (message: string, title?: string, options?: Partial<Alert>) => string
  showError: (message: string, title?: string, options?: Partial<Alert>) => string
  showWarning: (message: string, title?: string, options?: Partial<Alert>) => string
  showInfo: (message: string, title?: string, options?: Partial<Alert>) => string
  showLoading: (message: string, title?: string) => string
  showValidationErrors: (errors: ValidationError[], title?: string) => void
  showApiError: (error: ApiErrorResponse | any, defaultMessage?: string) => void
  showConfirmation: (message: string, onConfirm: () => void, onCancel?: () => void) => string
  updateAlert: (id: string, updates: Partial<Alert>) => void
  removeAlert: (id: string) => void
  clearAlerts: () => void
  clearAlertsByType: (type: Alert['type']) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

  const showAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const id = generateId()
    const newAlert: Alert = {
      id,
      duration: ALERT_DURATION, // Use global constant
      dismissible: true,
      position: 'top-right',
      ...alert,
    }

    setAlerts(prev => [...prev, newAlert])

    // Auto remove alert after duration (unless persistent or loading)
    if (!newAlert.persistent && newAlert.type !== 'loading' && newAlert.duration) {
      setTimeout(() => {
        removeAlert(id)
      }, newAlert.duration)
    }

    return id
  }, [])

  const showSuccess = useCallback((message: string, title?: string, options?: Partial<Alert>) => {
    return showAlert({
      type: 'success',
      message,
      title,
      duration: ALERT_DURATION, // Use global constant
      ...options
    })
  }, [showAlert])

  const showError = useCallback((message: string, title?: string, options?: Partial<Alert>) => {
    return showAlert({
      type: 'error',
      message,
      title,
      duration: ALERT_DURATION, // Use global constant
      ...options
    })
  }, [showAlert])

  const showWarning = useCallback((message: string, title?: string, options?: Partial<Alert>) => {
    return showAlert({
      type: 'warning',
      message,
      title,
      duration: ALERT_DURATION, // Use global constant
      ...options
    })
  }, [showAlert])

  const showInfo = useCallback((message: string, title?: string, options?: Partial<Alert>) => {
    return showAlert({
      type: 'info',
      message,
      title,
      duration: ALERT_DURATION, // Use global constant
      ...options
    })
  }, [showAlert])

  const showLoading = useCallback((message: string, title?: string) => {
    return showAlert({
      type: 'loading',
      message,
      title,
      persistent: true,
      dismissible: false
    })
  }, [showAlert])

  const showValidationErrors = useCallback((errors: ValidationError[], title?: string) => {
    // Clear previous validation errors
    clearAlertsByType('error')

    if (errors.length === 1) {
      showAlert({
        type: 'error',
        title: title || 'Validation Error',
        message: errors[0].message,
        duration: ALERT_DURATION // Use global constant
      })
    } else if (errors.length > 1) {
      const errorList = errors.map(error => `• ${error.message}`).join('\n')
      showAlert({
        type: 'error',
        title: title || `${errors.length} Validation Errors`,
        message: errorList,
        duration: ALERT_DURATION // Use global constant
      })
    }
  }, [showAlert])

  const showApiError = useCallback((error: ApiErrorResponse | any, defaultMessage = 'An unexpected error occurred') => {
    // Handle API error responses
    if (error?.errors && Array.isArray(error.errors)) {
      showValidationErrors(error.errors, 'Validation Failed')
      return
    }

    // Handle structured error responses
    if (error?.message) {
      showError(error.message, error.statusCode ? `Error ${error.statusCode}` : undefined)
      return
    }

    // Handle error objects
    if (error instanceof Error) {
      showError(error.message, 'Error')
      return
    }

    // Handle string errors
    if (typeof error === 'string') {
      showError(error)
      return
    }

    // Fallback
    showError(defaultMessage)
  }, [showError, showValidationErrors])

  const showConfirmation = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    return showAlert({
      type: 'warning',
      title: 'Confirmation Required',
      message,
      persistent: true,
      actions: [
        {
          label: 'Confirm',
          onClick: () => {
            onConfirm()
            // The alert will be removed when action is clicked
          },
          style: 'primary'
        },
        {
          label: 'Cancel',
          onClick: () => {
            onCancel?.()
            // The alert will be removed when action is clicked
          },
          style: 'secondary'
        }
      ]
    })
  }, [showAlert])

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const updateAlert = useCallback((id: string, updates: Partial<Alert>) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        const updatedAlert = { ...alert, ...updates }

        // If updating to a non-loading type and no duration is set, use default duration
        if (!updatedAlert.duration && updatedAlert.type !== 'loading') {
          updatedAlert.duration = ALERT_DURATION
        }

        // Set up auto-removal if changing from loading to another type
        if (alert.type === 'loading' && updatedAlert.type !== 'loading' && !updatedAlert.persistent) {
          const duration = updatedAlert.duration || ALERT_DURATION
          setTimeout(() => {
            removeAlert(id)
          }, duration)
        }

        return updatedAlert
      }
      return alert
    }))
  }, [removeAlert])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const clearAlertsByType = useCallback((type: Alert['type']) => {
    setAlerts(prev => prev.filter(alert => alert.type !== type))
  }, [])

  return (
    <AlertContext.Provider
      value={{
        alerts,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        showValidationErrors,
        showApiError,
        showConfirmation,
        updateAlert,
        removeAlert,
        clearAlerts,
        clearAlertsByType,
      }}
    >
      {children}
    </AlertContext.Provider>


    // Update alert by id
  )
}