import React from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

interface Option {
  value: string | number
  label: string
}

interface FormSelectProps {
  label: string
  name: string
  value: string | number
  onChange: (name: string, value: any) => void
  onBlur: (name: string) => void
  options: Option[]
  error?: string
  touched?: boolean
  required?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  touched,
  required = false,
  placeholder = 'Select an option',
  disabled = false,
  className = ''
}) => {
  const hasError = touched && error

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name, e.target.value)
  }

  const handleBlur = () => {
    onBlur(name)
  }

  const selectClasses = `
    w-full px-3 py-2 border rounded-xl shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:cursor-not-allowed
    appearance-none bg-white
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
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
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

export default FormSelect