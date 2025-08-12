import React from 'react'
import { AlertCircle } from 'lucide-react'

interface FormInputProps {
  label: string
  name: string
  type?: string
  value: string | number
  onChange: (name: string, value: any) => void
  onBlur: (name: string) => void
  error?: string
  touched?: boolean
  required?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  min?: number
  max?: number
  step?: string
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  min,
  max,
  step
}) => {
  const hasError = touched && error

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? e.target.valueAsNumber || 0 : e.target.value
    onChange(name, newValue)
  }

  const handleBlur = () => {
    onBlur(name)
  }

  const inputClasses = `
    w-full px-3 py-2 border rounded-xl shadow-sm placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:cursor-not-allowed
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
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
        />

        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {hasError && (
        <p className="text-sm text-red-600 flex items-center mt-1">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default FormInput