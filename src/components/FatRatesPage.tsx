"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Percent } from "lucide-react"
import type { FatRate } from "../types"
import { getFatRates, saveFatRates } from "../utils/storage"
import { useAlert } from "../contexts/AlertContext"
import { useFormValidation } from "../hooks/useFormValidation"
import { ErrorHandler } from "../utils/errorHandler"
import FormInput from "./FormInput"

export default function FatRatesPage() {
  const { showSuccess, showError } = useAlert()
  const [fatRates, setFatRates] = useState<FatRate[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<FatRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { values: formData, errors, touched, handleChange, handleBlur, validateForm, resetForm, setFieldValue } = useFormValidation(
    {
      fatPercentage: 0,
      rate: 0,
    },
    {
      fatPercentage: {
        required: true,
        min: 0.1,
        max: 10,
        custom: (value) => {
          const num = Number(value)
          if (num <= 0 || num > 10) {
            return 'Fat percentage must be between 0.1 and 10'
          }
          const existingRate = fatRates.find(rate =>
            rate.fatPercentage === num &&
            (!editingRate || rate.fatPercentage !== editingRate.fatPercentage)
          )
          if (existingRate) {
            return 'Fat percentage already exists'
          }
          return null
        }
      },
      rate: {
        required: true,
        min: 0.01,
        custom: (value) => {
          const num = Number(value)
          if (num <= 0) {
            return 'Rate must be greater than 0'
          }
          return null
        }
      }
    }
  )

  useEffect(() => {
    const loadFatRates = async () => {
      setLoading(true)
      try {
        const rates = await getFatRates()
        setFatRates(rates)
      } catch (error) {
        console.error('Error loading fat rates:', error)
        const errorInfo = ErrorHandler.handleApiError(error)
        showError(errorInfo.message, "Failed to Load Fat Rates")
      } finally {
        setLoading(false)
      }
    }
    loadFatRates()
  }, [showError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const newRate: FatRate = {
        fatPercentage: Number(formData.fatPercentage),
        rate: Number(formData.rate),
      }

      let updatedRates: FatRate[]

      if (editingRate) {
        updatedRates = fatRates.map((rate) => (rate.fatPercentage === editingRate.fatPercentage ? newRate : rate))
        showSuccess(`Fat rate for ${newRate.fatPercentage}% updated successfully!`)
      } else {
        const existingIndex = fatRates.findIndex((rate) => rate.fatPercentage === newRate.fatPercentage)
        if (existingIndex >= 0) {
          updatedRates = fatRates.map((rate, index) => (index === existingIndex ? newRate : rate))
          showSuccess(`Fat rate for ${newRate.fatPercentage}% updated successfully!`)
        } else {
          updatedRates = [...fatRates, newRate]
          showSuccess(`Fat rate for ${newRate.fatPercentage}% added successfully!`)
        }
      }

      updatedRates.sort((a, b) => a.fatPercentage - b.fatPercentage)

      setFatRates(updatedRates)
      await saveFatRates(updatedRates)
      resetForm()
      setIsModalOpen(false)
      setEditingRate(null)
    } catch (error) {
      console.error('Error saving fat rate:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      showError(errorInfo.message, "Failed to Save Fat Rate")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (rate: FatRate) => {
    setEditingRate(rate)
    setFieldValue('fatPercentage', rate.fatPercentage)
    setFieldValue('rate', rate.rate)
    setIsModalOpen(true)
  }

  const handleDelete = async (fatPercentage: number) => {
    if (confirm(`Are you sure you want to delete the fat rate for ${fatPercentage}%? This action cannot be undone.`)) {
      try {
        const updatedRates = fatRates.filter((rate) => rate.fatPercentage !== fatPercentage)
        setFatRates(updatedRates)
        await saveFatRates(updatedRates)
        showSuccess(`Fat rate for ${fatPercentage}% deleted successfully.`)
      } catch (error) {
        console.error('Error deleting fat rate:', error)
        const errorInfo = ErrorHandler.handleApiError(error)
        showError(errorInfo.message, "Failed to Delete Fat Rate")
      }
    }
  }



  const handleCloseModal = () => {
    resetForm()
    setEditingRate(null)
    setIsModalOpen(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Fat Rate Management</h1>

        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Manage milk fat percentage rates for accurate pricing calculations.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Rate
          </button>
        </div>
      </div>

      {/* Fat Rates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {fatRates.map((rate) => (
          <div
            key={rate.fatPercentage}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">{rate.fatPercentage}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(rate)}
                  disabled={loading}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rate.fatPercentage)}
                  disabled={loading}
                  className="p-1 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">₹{rate.rate}</span>
              <span className="text-sm text-gray-500">per liter</span>
            </div>
          </div>
        ))}
      </div>

      {fatRates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No fat rates configured</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Add Your First Rate
          </button>
        </div>
      )}

      {/* Add/Edit Rate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingRate ? "Edit Fat Rate" : "Add Fat Rate"}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Fat Percentage (%)"
                name="fatPercentage"
                type="number"
                value={formData.fatPercentage}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.fatPercentage}
                touched={touched.fatPercentage}
                required
                min={0.1}
                max={15}
                step="0.1"
                placeholder="e.g., 4.5"
                disabled={isSubmitting}
              />

              <FormInput
                label="Rate per Liter (₹)"
                name="rate"
                type="number"
                value={formData.rate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.rate}
                touched={touched.rate}
                required
                min={0.01}
                step="0.01"
                placeholder="e.g., 45.00"
                disabled={isSubmitting}
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingRate ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    `${editingRate ? "Update" : "Add"} Rate`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
