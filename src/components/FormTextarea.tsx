import React from 'react'
import { AlertCircle } from 'lucide-react'

interface FormTextareaProps {
  label: string
  name: string
  value: string
  onChange: (name: string, value: any) => void
  onBlur: (name: string) => void
  error?: string
  touched?: boolean
  required?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  rows?: number
  maxLength?: number
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  rows = 3,
  maxLength
}) => {
  const hasError = touched && error

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(name, e.target.value)
  }

  const handleBlur = () => {
    onBlur(name)
  }

  const textareaClasses = `
    w-full px-3 py-2 border rounded-xl shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:cursor-not-allowed resize-vertical
    ${hasError
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300'
    }
    ${className}
  `.trim()

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={textareaClasses}
        />

        {hasError && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        {hasError && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}

        {maxLength && (
          <p className="text-sm text-gray-500 ml-auto">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

export default FormTextarea