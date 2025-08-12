"use client"

import type React from "react"

import { useState } from "react"
import { LogIn } from "lucide-react"
import { authService } from "../utils/auth"
import { useFormValidation } from "../hooks/useFormValidation"
import { useAlert } from "../contexts/AlertContext"
import { ErrorHandler } from "../utils/errorHandler"
import FormInput from "./FormInput"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { showError, showSuccess } = useAlert()

  const { values, errors, touched, handleChange, handleBlur, validateForm } = useFormValidation(
    { username: '', password: '' },
    {
      username: {
        required: true,
        minLength: 3,
        maxLength: 50
      },
      password: {
        required: true,
        minLength: 6
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const user = await authService.login(values.username, values.password)
      if (user) {
        showSuccess("Login successful! Welcome back.")
        setTimeout(() => {
          window.location.href = window.location.pathname
        }, 1200)
      }
    } catch (error) {
      console.error('Login failed:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      if (errorInfo.validationErrors && errorInfo.validationErrors.length > 0) {
        const validationMessages = errorInfo.validationErrors.map(err => err.message).join(', ')
        showError(`Validation error: ${validationMessages}`, "Validation Failed")
        return
      }
      const loginError = ErrorHandler.handleLoginError(error)
      showError(loginError.message, loginError.title)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/lord-venkatesa-logo.jpg"
                alt="Lord Ganesha"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">MSR Milk Center</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Username"
              name="username"
              type="text"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.username}
              touched={touched.username}
              required
              placeholder="Enter your username"
              disabled={isLoading}
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              touched={touched.password}
              required
              placeholder="Enter your password"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          
        </div>
      </div>
    </div>
  )
}
