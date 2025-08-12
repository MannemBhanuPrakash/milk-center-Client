"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Calendar, Clock, Edit2, RotateCcw, Save, X, Droplets, DollarSign } from "lucide-react"
import type { User, Collection, FatRate } from "../types"
import { getUsers, getCollections, addCollection, getFatRates, updateCollection } from "../utils/storage"
import { calculateRate } from "../utils/fatRates"
import { useAlert } from "../contexts/AlertContext"
import { useFormValidation } from "../hooks/useFormValidation"
import { ErrorHandler } from "../utils/errorHandler"
import { eventBus, EVENTS } from "../utils/eventBus"
import { authService } from "../utils/auth"


export default function MilkCollection() {
  const { showSuccess, showError, showWarning, showLoading, showApiError } = useAlert()
  const [users, setUsers] = useState<User[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [fatRates, setFatRates] = useState<FatRate[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAmountManual, setIsAmountManual] = useState(false)

  const { values: formData, validateForm, resetForm: resetValidationForm, setFieldValue, handleChange } = useFormValidation(
    {
      userId: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      liters: "",
      fatPercentage: "",
      amount: "",
    },
    {
      userId: { required: true },
      date: { required: true },
      time: { required: true },
      liters: { required: true, min: 0.1, max: 1000 },
      fatPercentage: { required: true, min: 0.1, max: 15 },
      amount: { required: true, min: 0.01 }
    }
  )

  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    userId: "",
    date: "",
    time: "",
    liters: "",
    fatPercentage: "",
    amount: "",
  })
  const [isEditAmountManual, setIsEditAmountManual] = useState(false)
  const [editFatRateError, setEditFatRateError] = useState("")

  const getCurrentTimePeriod = (): "am" | "pm" => {
    const currentHour = new Date().getHours()
    return currentHour < 12 ? "am" : "pm"
  }

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [timeFilter, setTimeFilter] = useState<"all" | "am" | "pm">(getCurrentTimePeriod())

  useEffect(() => {
    if (authService.isHelper()) {
      const today = new Date().toISOString().split("T")[0]
      setFilterDate(today)
    }
  }, [])

  const [fatRateError, setFatRateError] = useState("")

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      try {
        const [fetchedUsers, fetchedCollections, fetchedFatRates] = await Promise.all([
          getUsers(),
          getCollections(),
          getFatRates()
        ])
        setUsers(fetchedUsers)
        setCollections(fetchedCollections)
        setFatRates(fetchedFatRates)
      } catch (error) {
        console.error('Error loading data:', error)
        showApiError(error, 'Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [showLoading, showApiError])

  useEffect(() => {
    const handleUserUpdate = () => {
      console.log('User updated, refreshing collection data...')
      const refreshUsers = async () => {
        try {
          const fetchedUsers = await getUsers()
          setUsers(fetchedUsers)
        } catch (error) {
          console.error('Error refreshing users:', error)
        }
      }
      refreshUsers()
    }

    const handleDataRefresh = () => {
      console.log('Data refresh needed, refreshing collection data...')
      const refreshData = async () => {
        try {
          const [fetchedUsers, fetchedCollections] = await Promise.all([
            getUsers(),
            getCollections()
          ])
          setUsers(fetchedUsers)
          setCollections(fetchedCollections)
        } catch (error) {
          console.error('Error refreshing data:', error)
        }
      }
      refreshData()
    }

    eventBus.on(EVENTS.USER_UPDATED, handleUserUpdate)
    eventBus.on(EVENTS.USER_DELETED, handleDataRefresh)
    eventBus.on(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh)

    return () => {
      eventBus.off(EVENTS.USER_UPDATED, handleUserUpdate)
      eventBus.off(EVENTS.USER_DELETED, handleDataRefresh)
      eventBus.off(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh)
    }
  }, [])

  useEffect(() => {
    if (!isAmountManual && formData.liters && formData.fatPercentage) {
      const liters = Number.parseFloat(formData.liters)
      const fatPercentage = Number.parseFloat(formData.fatPercentage)
      const rate = calculateRate(fatPercentage, fatRates)
      const calculatedAmount = liters * rate
      setFieldValue('amount', calculatedAmount.toFixed(2))
    }
  }, [formData.liters, formData.fatPercentage, fatRates, isAmountManual, setFieldValue])

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    const user = users.find(u => String(u.id) === String(collection.userId))
    setEditFormData({
      userId: String(user ? user.id : collection.userId),
      date: collection.date,
      time: collection.time,
      liters: collection.liters.toString(),
      fatPercentage: collection.fatPercentage.toString(),
      amount: collection.amount.toString(),
    })
    setIsEditAmountManual(collection.isManuallyEdited || false)
    setEditFatRateError("")
    setShowEditModal(true)
  }

  const handleEditFatPercentageChange = (value: string) => {
    setEditFormData({ ...editFormData, fatPercentage: value })

    setEditFatRateError("")

    if (value) {
      const fatPercentage = Number.parseFloat(value)
      if (!isNaN(fatPercentage)) {
        const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)

        if (!exactMatch) {
          setEditFatRateError(
            `Fat rate not available for ${fatPercentage}%. Please configure this exact fat rate first.`,
          )
        }
      }
    }
  }

  const handleEditAmountChange = (value: string) => {
    setEditFormData((prev) => ({ ...prev, amount: value }))
    setIsEditAmountManual(true)
  }

  const handleEditAmountModeToggle = () => {
    if (isEditAmountManual) {
      setIsEditAmountManual(false)
      if (editFormData.liters && editFormData.fatPercentage) {
        const liters = Number.parseFloat(editFormData.liters)
        const fatPercentage = Number.parseFloat(editFormData.fatPercentage)
        const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
        const rate = exactMatch ? exactMatch.rate : 0
        const calculatedAmount = liters * rate
        setEditFormData((prev) => ({ ...prev, amount: calculatedAmount.toFixed(2) }))
      }
    } else {
      setIsEditAmountManual(true)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCollection) return

    // Check for fat rate error
    if (editFatRateError) {
      showWarning("Please resolve the fat rate error before submitting.")
      return
    }

    const user = users.find((u) => u.id === editFormData.userId)
    if (!user) return

    // Check if user is active
    if (user.isActive === false) {
      showError("Cannot update collection for deactivated farmer. Please contact admin to reactivate the account.")
      return
    }

    const liters = Number.parseFloat(editFormData.liters)
    const fatPercentage = Number.parseFloat(editFormData.fatPercentage)

    // Use exact match only for rate calculation
    const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
    if (!exactMatch) {
      showError(`Fat rate not available for ${fatPercentage}%. Please configure this exact fat rate first.`, 'Missing Fat Rate')
      return
    }

    const rate = exactMatch.rate
    const amount = Number.parseFloat(editFormData.amount)

    // Check if amount was manually edited
    const autoCalculatedAmount = liters * rate
    const wasManuallyEdited = Math.abs(amount - autoCalculatedAmount) > 0.01

    setLoading(true)
    try {
      const updatedCollection = await updateCollection(editingCollection.id, {
        userId: editFormData.userId,
        userName: user.name,
        date: editFormData.date,
        time: editFormData.time,
        liters,
        fatPercentage,
        rate,
        amount,
        isManuallyEdited: wasManuallyEdited,
      })

      if (updatedCollection) {
        setCollections(collections.map((c) => (c.id === editingCollection.id ? updatedCollection : c)))
        const user = users.find((u) => u.id === updatedCollection.userId)
        showSuccess(`Collection updated successfully for ${user?.name || 'farmer'}!`)
        resetEditForm()
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      showError(errorInfo.message, 'Update Failed')
    } finally {
      setLoading(false)
    }
  }

  const resetEditForm = () => {
    setEditingCollection(null)
    setEditFormData({
      userId: "",
      date: "",
      time: "",
      liters: "",
      fatPercentage: "",
      amount: "",
    })
    setIsEditAmountManual(false)
    setEditFatRateError("")
    setShowEditModal(false)
  }

  // Auto-calculate amount for edit form when liters or fat percentage changes (only if not manual)
  useEffect(() => {
    if (!isEditAmountManual && editFormData.liters && editFormData.fatPercentage) {
      const liters = Number.parseFloat(editFormData.liters)
      const fatPercentage = Number.parseFloat(editFormData.fatPercentage)
      const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
      const rate = exactMatch ? exactMatch.rate : 0
      const calculatedAmount = liters * rate
      setEditFormData((prev) => ({ ...prev, amount: calculatedAmount.toFixed(2) }))
    }
  }, [editFormData.liters, editFormData.fatPercentage, fatRates, isEditAmountManual])

  const handleFatPercentageChange = (value: string) => {
    setFieldValue('fatPercentage', value)

    // Clear previous error
    setFatRateError("")

    // Validate fat rate availability
    if (value) {
      const fatPercentage = Number.parseFloat(value)
      if (!isNaN(fatPercentage)) {
        // Check for exact match only - no interpolation
        const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)

        if (!exactMatch) {
          setFatRateError(`Fat rate not available for ${fatPercentage}%. Please configure this exact fat rate first.`)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check for fat rate error
    if (fatRateError) {
      showWarning("Please resolve the fat rate error before submitting.")
      return
    }

    const user = users.find((u) => u.id === formData.userId)
    if (!user) {
      showError("Please select a valid user.")
      return
    }

    // Check if user is active
    if (user.isActive === false) {
      showError("Cannot add collection for deactivated farmer. Please contact admin to reactivate the account.")
      return
    }

    const liters = Number(formData.liters)
    const fatPercentage = Number(formData.fatPercentage)

    // Use exact match only for rate calculation
    const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
    if (!exactMatch) {
      showError(`Fat rate not available for ${fatPercentage}%. Please configure this exact fat rate first.`)
      return
    }

    const rate = exactMatch.rate
    const amount = Number(formData.amount)

    // Check if amount was manually edited
    const autoCalculatedAmount = liters * rate
    const wasManuallyEdited = Math.abs(amount - autoCalculatedAmount) > 0.01

    try {
      const newCollection = await addCollection({
        userId: formData.userId,
        userName: user.name,
        date: formData.date,
        time: formData.time,
        liters,
        fatPercentage,
        rate,
        amount,
        isManuallyEdited: wasManuallyEdited,
      })

      if (newCollection) {
        setCollections([newCollection, ...collections])
        resetForm()
        setShowAddForm(false)
        setIsAmountManual(false)
        showSuccess(`Collection added successfully for ${user.name}!`)
      }
    } catch (error) {
      console.error('Error adding collection:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      if (errorInfo.validationErrors) {
        // Validation errors are already shown by the form validation hook
        return
      }
      showError(errorInfo.message, "Failed to Add Collection")
    }
  }

  const handleAmountChange = (value: string) => {
    setFieldValue('amount', value)
    setIsAmountManual(true)
  }

  const handleAmountModeToggle = () => {
    if (isAmountManual) {
      // Switch to auto mode
      setIsAmountManual(false)
      if (formData.liters && formData.fatPercentage) {
        const liters = Number.parseFloat(formData.liters)
        const fatPercentage = Number.parseFloat(formData.fatPercentage)
        const rate = calculateRate(fatPercentage, fatRates)
        const calculatedAmount = liters * rate
        setFieldValue('amount', calculatedAmount.toFixed(2))
      }
    } else {
      // Switch to manual mode
      setIsAmountManual(true)
    }
  }

  const resetForm = () => {
    resetValidationForm() // Reset validation form
    setIsAmountManual(false)
    setFatRateError("") // Clear fat rate error
    setShowAddForm(false)
  }

  // Helper function to check if time is AM or PM
  const isAMTime = (time: string) => {
    const [hours] = time.split(":")
    const hour24 = Number.parseInt(hours)
    return hour24 < 12
  }

  // Filter collections by date and time period
  const filteredCollections = collections.filter((collection) => {
    // Filter by date
    const dateMatch = filterDate ? collection.date === filterDate : true

    // Filter by time period
    let timeMatch = true
    if (timeFilter === "am") {
      timeMatch = isAMTime(collection.time)
    } else if (timeFilter === "pm") {
      timeMatch = !isAMTime(collection.time)
    }

    return dateMatch && timeMatch
  })

  // Helper function to format time in 12-hour format
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour24 = Number.parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? "PM" : "AM"
    return `${hour12}:${minutes} ${ampm}`
  }

  // Calculate preview values for the form - use exact match only
  const getExactRate = (fatPercentage: number) => {
    const exactMatch = fatRates.find((rate) => rate.fatPercentage === fatPercentage)
    return exactMatch ? exactMatch.rate : 0
  }

  const previewRate = formData.fatPercentage ? getExactRate(Number.parseFloat(formData.fatPercentage)) : 0
  const autoCalculatedAmount =
    formData.liters && formData.fatPercentage ? Number.parseFloat(formData.liters) * previewRate : 0

  // Get current date display
  const isToday = filterDate === new Date().toISOString().split("T")[0]
  const currentTimePeriod = getCurrentTimePeriod()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Milk Collection</h1>

        {/* Add Collection Form */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {showAddForm ? "Add New Collection" : "Quick Add Collection"}
            </h2>
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Collection
              </button>
            ) : (
              <button
                onClick={resetForm}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => handleChange('userId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a farmer</option>
                    {users.filter(user => user.isActive !== false).map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.liters}
                    onChange={(e) => handleChange('liters', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={formData.fatPercentage}
                    onChange={(e) => handleFatPercentageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                  {fatRateError && (
                    <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-4 h-4 text-red-500">⚠</span>
                      {fatRateError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                    {isAmountManual && (
                      <span className="text-xs text-orange-600 ml-2 bg-orange-100 px-1 py-0.5 rounded">Manual</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Auto-calculated"
                    />
                    <button
                      type="button"
                      onClick={handleAmountModeToggle}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      title={isAmountManual ? "Switch to auto-calculate" : "Switch to manual entry"}
                    >
                      {isAmountManual ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {formData.liters && formData.fatPercentage && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Rate/Liter:</span>
                      <span className="font-semibold ml-2">₹{previewRate}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Auto Amount:</span>
                      <span className="font-semibold ml-2">₹{autoCalculatedAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Final Amount:</span>
                      <span className="font-semibold ml-2">
                        ₹{formData.amount ? Number.parseFloat(formData.amount).toFixed(2) : "0.00"}
                        {isAmountManual && <span className="text-orange-600 ml-1 text-xs">(M)</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Status:</span>
                      <span className={`font-semibold ml-2 ${isAmountManual ? "text-orange-600" : "text-green-600"}`}>
                        {isAmountManual ? "Manual" : "Auto"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Collection'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Demo Credentials */}

      </div>

      {/* Edit Collection Modal */}
      {showEditModal && editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Collection</h2>
              <button onClick={resetEditForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
                  <select
                    required
                    value={editFormData.userId}
                    onChange={(e) => setEditFormData({ ...editFormData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a farmer</option>
                    {users.filter(user => user.isActive !== false).map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={editFormData.time}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editFormData.liters}
                    onChange={(e) => setEditFormData({ ...editFormData, liters: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={editFormData.fatPercentage}
                    onChange={(e) => handleEditFatPercentageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                  {editFatRateError && (
                    <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span className="w-4 h-4 text-red-500">⚠</span>
                      {editFatRateError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                    {isEditAmountManual && (
                      <span className="text-xs text-orange-600 ml-2 bg-orange-100 px-1 py-0.5 rounded">Manual</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editFormData.amount}
                      onChange={(e) => handleEditAmountChange(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Auto-calculated"
                    />
                    <button
                      type="button"
                      onClick={handleEditAmountModeToggle}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      title={isEditAmountManual ? "Switch to auto-calculate" : "Switch to manual entry"}
                    >
                      {isEditAmountManual ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Preview Section */}
              {editFormData.liters && editFormData.fatPercentage && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Rate/Liter:</span>
                      <span className="font-semibold ml-2">
                        ₹
                        {editFormData.fatPercentage
                          ? fatRates.find(
                            (rate) => rate.fatPercentage === Number.parseFloat(editFormData.fatPercentage),
                          )?.rate || 0
                          : 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Auto Amount:</span>
                      <span className="font-semibold ml-2">
                        ₹
                        {editFormData.liters && editFormData.fatPercentage
                          ? (
                            Number.parseFloat(editFormData.liters) *
                            (fatRates.find(
                              (rate) => rate.fatPercentage === Number.parseFloat(editFormData.fatPercentage),
                            )?.rate || 0)
                          ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Final Amount:</span>
                      <span className="font-semibold ml-2">
                        ₹{editFormData.amount ? Number.parseFloat(editFormData.amount).toFixed(2) : "0.00"}
                        {isEditAmountManual && <span className="text-orange-600 ml-1 text-xs">(M)</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Status:</span>
                      <span
                        className={`font-semibold ml-2 ${isEditAmountManual ? "text-orange-600" : "text-green-600"}`}
                      >
                        {isEditAmountManual ? "Manual" : "Auto"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Collections
              {filterDate && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  ({isToday ? "Today" : new Date(filterDate).toLocaleDateString()})
                  {timeFilter !== "all" && (
                    <span className="ml-1 text-xs bg-blue-100 px-2 py-1 rounded uppercase font-medium">
                      {timeFilter}
                      {isToday && timeFilter === currentTimePeriod && (
                        <span className="ml-1 text-green-600">• Current</span>
                      )}
                    </span>
                  )}
                </span>
              )}
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Date Filter - Hidden for helpers */}
              {authService.canAccessAdvancedFeatures() && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      if (!authService.isHelper()) {
                        setFilterDate(e.target.value)
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      setFilterDate(new Date().toISOString().split("T")[0])
                      setTimeFilter(getCurrentTimePeriod())
                    }}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl"
                  >
                    Now
                  </button>
                </div>
              )}

              {/* AM/PM Filter Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setTimeFilter("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-xl transition-colors ${timeFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTimeFilter("am")}
                  className={`px-3 py-1 text-xs font-medium rounded-xl transition-colors relative ${timeFilter === "am" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  AM
                  {isToday && currentTimePeriod === "am" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setTimeFilter("pm")}
                  className={`px-3 py-1 text-xs font-medium rounded-xl transition-colors relative ${timeFilter === "pm" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  PM
                  {isToday && currentTimePeriod === "pm" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fat %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.slice(0, 20).map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {collection.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(collection.date).toLocaleDateString()}
                      <Clock className="w-4 h-4 ml-2" />
                      <span className="font-medium text-blue-600">{formatTime(collection.time)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{collection.liters}L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{collection.fatPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{collection.rate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    <div className="flex items-center gap-2">
                      <span>₹{collection.amount.toFixed(2)}</span>
                      {collection.isManuallyEdited && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded font-bold">(M)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {authService.canModifyData() ? (
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="Edit Collection"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filterDate
                ? `No collections found for ${isToday ? "today" : new Date(filterDate).toLocaleDateString()}${timeFilter !== "all" ? ` in the ${timeFilter.toUpperCase()}` : ""
                }`
                : "No collections recorded yet"}
            </p>
            {filterDate && (
              <button
                onClick={() => {
                  setFilterDate("")
                  setTimeFilter("all")
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm rounded-xl"
              >
                View all collections
              </button>
            )}
          </div>
        )}

        {/* Summary for filtered results */}
        {!authService.isHelper() && filteredCollections.length > 0 && (
          <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 rounded-b-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collections</p>
                    <p className="text-2xl font-bold text-blue-900">{filteredCollections.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Droplets className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Liters</p>
                    <p className="text-2xl font-bold text-green-900">
                      {filteredCollections.reduce((sum, c) => sum + c.liters, 0).toFixed(1)}L
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ₹{filteredCollections.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


