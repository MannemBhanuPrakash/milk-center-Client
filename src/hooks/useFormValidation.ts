import { useState, useCallback } from 'react'
import { useAlert, ValidationError } from '../contexts/AlertContext'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface FormErrors {
  [key: string]: string
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules
) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const { showValidationErrors } = useAlert()

  const formatFieldName = useCallback((fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }, [])

  const validateField = useCallback((name: string, value: any): string => {
    const rules = validationRules[name]
    if (!rules) return ''

    const displayName = formatFieldName(name)

    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${displayName} is required`
    }

    if (!value && !rules.required) return ''

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `${displayName} must be at least ${rules.minLength} characters long`
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `${displayName} must not exceed ${rules.maxLength} characters`
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return `${displayName} format is invalid`
      }
    }

    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      if (rules.min !== undefined && numValue < rules.min) {
        return `${displayName} must be at least ${rules.min}`
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return `${displayName} must not exceed ${rules.max}`
      }
    }

    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) return customError
    }

    return ''
  }, [validationRules, formatFieldName])

  const validateForm = useCallback((showAlerts = true): boolean => {
    const newErrors: FormErrors = {}
    const validationErrors: ValidationError[] = []

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        validationErrors.push({
          field: formatFieldName(fieldName),
          message: error,
          type: getValidationErrorType(error)
        })
      }
    })

    setErrors(newErrors)

    const allTouched = Object.keys(validationRules).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
    setTouched(allTouched)

    if (validationErrors.length > 0 && showAlerts) {
      showValidationErrors(validationErrors, `Form Validation Failed`)
      return false
    }

    return validationErrors.length === 0
  }, [values, validateField, showValidationErrors, formatFieldName, validationRules])

  const getValidationErrorType = useCallback((errorMessage: string): ValidationError['type'] => {
    if (errorMessage.includes('required')) return 'required'
    if (errorMessage.includes('format') || errorMessage.includes('invalid')) return 'format'
    if (errorMessage.includes('must be') || errorMessage.includes('characters') || errorMessage.includes('at least') || errorMessage.includes('exceed')) return 'range'
    return 'custom'
  }, [])

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))

    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [validateField, values])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setFieldValue = useCallback((name: string, value: any) => {
    handleChange(name, value)
  }, [handleChange])

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => ({ ...prev, [name]: '' }))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasFieldError = useCallback((name: string) => {
    return touched[name] && errors[name] !== ''
  }, [touched, errors])

  const getFieldError = useCallback((name: string) => {
    return touched[name] ? errors[name] : ''
  }, [touched, errors])

  const setMultipleFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
    setErrors(prev => ({ ...prev, ...fieldErrors }))
    const touchedFields = Object.keys(fieldErrors).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
    setTouched(prev => ({ ...prev, ...touchedFields }))
  }, [])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasFieldError,
    getFieldError,
    setMultipleFieldErrors,
    isValid: Object.values(errors).every(error => error === ''),
    hasErrors: Object.values(errors).some(error => error !== ''),
    isDirty: Object.keys(touched).some(key => touched[key])
  }
}