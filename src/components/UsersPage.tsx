"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Eye,
  ArrowLeft,
  Droplets,
  DollarSign,
  TrendingUp,
  FileText,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react"
import type { User, Helper } from "../types"
import { getUsers, addUser, updateUser, deleteUser } from "../utils/storage"
import { apiService } from "../utils/api"
import { useAlert } from "../contexts/AlertContext"
import { useFormValidation } from "../hooks/useFormValidation"
import { ErrorHandler } from "../utils/errorHandler"
import { eventBus, EVENTS } from "../utils/eventBus"
import { authService } from "../utils/auth"
import FormInput from "./FormInput"
import FormTextarea from "./FormTextarea"

interface UserStatsProps {
  userId: string
}

const UserStatsCard: React.FC<UserStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    collectionsCount: 0,
    totalLiters: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) {
        console.warn('UserStatsCard: userId is undefined')
        setLoading(false)
        return
      }

      try {
        const userStats = await getUserStats(userId)
        setStats({
          collectionsCount: userStats.collectionsCount,
          totalLiters: userStats.totalLiters
        })
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [userId])

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <p className="text-gray-500">Collections</p>
            <p className="font-semibold text-blue-600">...</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Total Liters</p>
            <p className="font-semibold text-green-600">...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <p className="text-gray-500">Collections</p>
          <p className="font-semibold text-blue-600">{stats.collectionsCount}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Total Liters</p>
          <p className="font-semibold text-green-600">{stats.totalLiters.toFixed(1)}L</p>
        </div>
      </div>
    </div>
  )
}

const getUserStats = async (userId: string) => {
  try {
    const response = await apiService.getUserStats(userId)
    return response.data?.stats || {
      totalLiters: 0,
      totalAmount: 0,
      totalAdvances: 0,
      netAmount: 0,
      avgFat: 0,
      collectionsCount: 0,
      advancesCount: 0,
      collections: [],
      advances: [],
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      totalLiters: 0,
      totalAmount: 0,
      totalAdvances: 0,
      netAmount: 0,
      avgFat: 0,
      collectionsCount: 0,
      advancesCount: 0,
      collections: [],
      advances: [],
    }
  }
}

export default function UsersPage() {
  const { showSuccess, showError, showConfirmation } = useAlert()
  const [users, setUsers] = useState<User[]>([])
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHelperModalOpen, setIsHelperModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingHelper, setEditingHelper] = useState<Helper | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'helpers'>('users')

  const { values: formData, errors, touched, handleChange, handleBlur, validateForm, resetForm, setFieldValue } = useFormValidation(
    {
      name: "",
      phoneNumber: "",
      address: "",
    },
    {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      phoneNumber: {
        required: true,
        pattern: /^[\+]?[\d\s\-\(\)]{10,15}$/,
        custom: (value) => {
          if (value && !/^\+?[\d\s\-\(\)]{10,15}$/.test(value)) {
            return 'Please enter a valid phone number'
          }
          return null
        }
      },
      address: {
        required: true,
        minLength: 5,
        maxLength: 500
      }
    }
  )

  const { values: helperFormData, errors: helperErrors, touched: helperTouched, handleChange: handleHelperChange, handleBlur: handleHelperBlur, validateForm: validateHelperForm, resetForm: resetHelperForm, setFieldValue: setHelperFieldValue } = useFormValidation(
    {
      name: "",
      username: "",
      password: "",
      phoneNumber: "",
    },
    {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/,
        custom: (value) => {
          if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores'
          }
          return null
        }
      },
      password: {
        required: true,
        minLength: 6
      },
      phoneNumber: {
        required: true,
        pattern: /^[\+]?[\d\s\-\(\)]{10,15}$/,
        custom: (value) => {
          if (value && !/^\+?[\d\s\-\(\)]{10,15}$/.test(value)) {
            return 'Please enter a valid phone number'
          }
          return null
        }
      }
    }
  )

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      try {
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers)
      } catch (error) {
        console.error('Error loading users:', error)
        const errorInfo = ErrorHandler.handleApiError(error)
        showError(errorInfo.message, "Failed to Load Users")
      } finally {
        setLoading(false)
      }
    }

    const loadHelpers = async () => {
      if (!authService.isAdmin()) return

      try {
        const response = await apiService.getHelpers()
        if (response.success && response.data?.helpers) {
          setHelpers(response.data.helpers)
        }
      } catch (error) {
        console.error('Error loading helpers:', error)
        const errorInfo = ErrorHandler.handleApiError(error)
        showError(errorInfo.message, "Failed to Load Helpers")
      }
    }

    loadUsers()
    loadHelpers()
  }, [showError])

  const filteredUsers = (users || []).filter(
    (user) => {
      if (!user) return false;

      const userName = String(user.name || '');
      const userPhone = String(user.phoneNumber || '');
      const searchLower = String(searchTerm || '').toLowerCase();

      return userName.toLowerCase().includes(searchLower) ||
        userPhone.toLowerCase().includes(searchLower);
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (editingUser) {
        const updatedUserOrError = await updateUser(editingUser.id, formData)
        if (updatedUserOrError && typeof updatedUserOrError === 'object' && 'success' in updatedUserOrError && updatedUserOrError.success === false) {
          const errorMsg = 'message' in updatedUserOrError ? updatedUserOrError.message : 'Failed to Update User';
          showError(String(errorMsg), "Failed to Update User")
          return
        }
        if (updatedUserOrError && !('success' in updatedUserOrError)) {
          setUsers(users.map((u) => (u.id === editingUser.id ? updatedUserOrError : u)))
          showSuccess(`User "${updatedUserOrError.name}" updated successfully!`)
          // Emit event to refresh other components
          eventBus.emit(EVENTS.USER_UPDATED, updatedUserOrError)
        } else if (!updatedUserOrError) {
          showError("Failed to update user - no response from server", "Failed to Update User")
          return
        }
      } else {
        const newUserOrError = await addUser(formData)
        if (newUserOrError && typeof newUserOrError === 'object' && 'success' in newUserOrError && newUserOrError.success === false) {
          const errorMsg = 'message' in newUserOrError ? newUserOrError.message : 'Failed to Add User';
          showError(String(errorMsg), "Failed to Add User")
          return
        }
        if (newUserOrError && !('success' in newUserOrError)) {
          setUsers([...users, newUserOrError])
          showSuccess(`User "${newUserOrError.name}" added successfully!`)
          eventBus.emit(EVENTS.DATA_REFRESH_NEEDED)
        } else if (!newUserOrError) {
          showError("Failed to add user - no response from server", "Failed to Add User")
          return
        }
      }
      resetForm()
      setIsModalOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error saving user:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      if (errorInfo.validationErrors) {
        // Validation errors are already shown by the form validation hook
        return
      }
      showError(errorInfo.message, editingUser ? "Failed to Update User" : "Failed to Add User")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFieldValue('name', user.name)
    setFieldValue('phoneNumber', user.phoneNumber)
    setFieldValue('address', user.address)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    const userToDelete = users.find(u => u.id === id)
    const userName = userToDelete?.name || 'Unknown User'

    // Use showConfirmation alert instead of window.confirm
    showConfirmation(
      `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      async () => {
        setLoading(true)
        try {
          const success = await deleteUser(id)
          if (success) {
            setUsers(users.filter((u) => u.id !== id))
            showSuccess(`User "${userName}" deleted successfully.`)
            // Emit event to refresh other components
            eventBus.emit(EVENTS.USER_DELETED, id)
          } else {
            showError("Failed to delete user", "Failed to Delete User")
          }
        } catch (error) {
          console.error('Error deleting user:', error)
          const errorInfo = ErrorHandler.handleApiError(error)
          showError(errorInfo.message, "Failed to Delete User")
        } finally {
          setLoading(false)
        }
      },
      () => {
        // Cancelled, do nothing
      }
    )
  }

  const handleOpenModal = () => {
    resetForm()
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    resetForm()
    setEditingUser(null)
    setIsModalOpen(false)
  }

  // User activation/deactivation handlers
  const handleDeactivateUser = (userId: string) => {
    const userToDeactivate = users.find(u => u.id === userId)
    const userName = userToDeactivate?.name || 'Unknown User'

    showConfirmation(
      `Are you sure you want to deactivate "${userName}"? This will prevent them from accessing the system.`,
      async () => {
        setLoading(true)
        try {
          const response = await apiService.deactivateUser(userId, 'Deactivated by admin')
          if (response.success && response.data?.user) {
            // Update the user in the local state
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: false, deactivatedAt: new Date().toISOString(), deactivationReason: 'Deactivated by admin' } : u))
            showSuccess(`User "${userName}" has been deactivated successfully.`)
            // Emit event for other components
            eventBus.emit(EVENTS.USER_DEACTIVATED, { userId, userName })
          }
        } catch (error) {
          console.error('Error deactivating user:', error)
          const errorInfo = ErrorHandler.handleApiError(error)
          showError(errorInfo.message, "Failed to Deactivate User")
        } finally {
          setLoading(false)
        }
      }
    )
  }

  const handleReactivateUser = (userId: string) => {
    const userToReactivate = users.find(u => u.id === userId)
    const userName = userToReactivate?.name || 'Unknown User'

    showConfirmation(
      `Are you sure you want to reactivate "${userName}"? This will restore their system access.`,
      async () => {
        setLoading(true)
        try {
          const response = await apiService.reactivateUser(userId)
          if (response.success && response.data?.user) {
            // Update the user in the local state
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: true, deactivatedAt: undefined, deactivationReason: undefined } : u))
            showSuccess(`User "${userName}" has been reactivated successfully.`)
            // Emit event for other components
            eventBus.emit(EVENTS.USER_REACTIVATED, { userId, userName })
          }
        } catch (error) {
          console.error('Error reactivating user:', error)
          const errorInfo = ErrorHandler.handleApiError(error)
          showError(errorInfo.message, "Failed to Reactivate User")
        } finally {
          setLoading(false)
        }
      }
    )
  }

  // Helper functions
  const handleHelperSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateHelperForm()) return

    setIsSubmitting(true)
    try {
      if (editingHelper) {
        // Update helper
        const response = await apiService.updateHelper(editingHelper.id, helperFormData)
        if (response.success && response.data?.helper) {
          setHelpers(helpers.map(h => h.id === editingHelper.id ? response.data!.helper : h))
          showSuccess(`Helper "${response.data.helper.name}" updated successfully!`)
        }
      } else {
        // Create new helper
        const response = await apiService.createHelper(helperFormData)
        if (response.success && response.data?.helper) {
          setHelpers([...helpers, response.data.helper])
          showSuccess(`Helper "${response.data.helper.name}" created successfully!`)
        }
      }
      resetHelperForm()
      setIsHelperModalOpen(false)
      setEditingHelper(null)
    } catch (error) {
      console.error('Error saving helper:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      showError(errorInfo.message, editingHelper ? "Failed to Update Helper" : "Failed to Create Helper")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHelperEdit = (helper: Helper) => {
    setEditingHelper(helper)
    setHelperFieldValue('name', helper.name)
    setHelperFieldValue('username', helper.username)
    setHelperFieldValue('phoneNumber', helper.phoneNumber)
    setHelperFieldValue('password', '') // Don't pre-fill password
    setIsHelperModalOpen(true)
  }

  const handleHelperDelete = (id: string) => {
    const helperToDelete = helpers.find(h => h.id === id)
    const helperName = helperToDelete?.name || 'Unknown Helper'

    showConfirmation(
      `Are you sure you want to delete helper "${helperName}"? This action cannot be undone.`,
      async () => {
        setLoading(true)
        try {
          const response = await apiService.deleteHelper(id)
          if (response.success) {
            setHelpers(helpers.filter(h => h.id !== id))
            showSuccess(`Helper "${helperName}" deleted successfully.`)
          }
        } catch (error) {
          console.error('Error deleting helper:', error)
          const errorInfo = ErrorHandler.handleApiError(error)
          showError(errorInfo.message, "Failed to Delete Helper")
        } finally {
          setLoading(false)
        }
      }
    )
  }

  const handleExtendHelperPassword = async (id: string) => {
    try {
      const response = await apiService.extendHelperPassword(id)
      if (response.success && response.data?.helper) {
        setHelpers(helpers.map(h => h.id === id ? response.data!.helper : h))
        showSuccess('Helper password expiry extended by 48 hours!')
      }
    } catch (error) {
      console.error('Error extending helper password:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      showError(errorInfo.message, "Failed to Extend Password")
    }
  }

  const handleToggleHelperStatus = async (id: string) => {
    try {
      const response = await apiService.toggleHelperStatus(id)
      if (response.success && response.data?.helper) {
        setHelpers(helpers.map(h => h.id === id ? response.data!.helper : h))
        showSuccess(`Helper ${response.data.helper.isActive ? 'activated' : 'deactivated'} successfully!`)
      }
    } catch (error) {
      console.error('Error toggling helper status:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      showError(errorInfo.message, "Failed to Toggle Helper Status")
    }
  }

  const handleOpenHelperModal = () => {
    resetHelperForm()
    setEditingHelper(null)
    setIsHelperModalOpen(true)
  }

  const handleCloseHelperModal = () => {
    resetHelperForm()
    setEditingHelper(null)
    setIsHelperModalOpen(false)
  }

  const filteredHelpers = (helpers || []).filter(
    (helper) => {
      if (!helper) return false
      const searchLower = searchTerm.toLowerCase()
      return (
        helper.name?.toLowerCase().includes(searchLower) ||
        helper.username?.toLowerCase().includes(searchLower) ||
        helper.phoneNumber?.includes(searchTerm)
      )
    }
  )

  // If a user is selected, show detailed report
  if (selectedUser) {
    return <UserDetails user={selectedUser} setSelectedUser={setSelectedUser} />
  }

  // Original users list view
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Users Management</h1>

        {/* Tabs for Users and Helpers (Admin only) */}
        {authService.isAdmin() && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Farmers ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('helpers')}
              className={`px-4 py-2 font-medium text-sm ml-8 ${activeTab === 'helpers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Helpers ({helpers.length})
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? "Search farmers by name or phone..." : "Search helpers by name, username or phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {activeTab === 'users' ? (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Farmer
            </button>
          ) : (
            authService.isAdmin() && (
              <button
                onClick={handleOpenHelperModal}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Helper
              </button>
            )
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'users' ? (
          filteredUsers.map((user) => (
            <div key={user.id} className={`rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow ${user.isActive === false ? 'bg-red-50 border-2 border-red-200' : 'bg-white'
              }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name || 'Unknown User'}</h3>
                    {user.isActive === false && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        Deactivated
                      </div>
                    )}
                  </div>
                  {user.isActive === false && user.deactivationReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {user.deactivationReason}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    disabled={loading}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {authService.isAdmin() && (
                    user.isActive === false ? (
                      <button
                        onClick={() => handleReactivateUser(user.id)}
                        disabled={loading}
                        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Reactivate User"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivateUser(user.id)}
                        disabled={loading}
                        className="p-1 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                        title="Deactivate User"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{user.phoneNumber || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{user.address || 'No address'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Added: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                </div>
                {user.isActive === false && user.deactivatedAt && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Deactivated: {new Date(user.deactivatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <UserStatsCard userId={user.id || ''} />
            </div>
          ))
        ) : (
          // Helpers Grid
          filteredHelpers.map((helper) => (
            <div key={helper.id} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{helper.name}</h3>
                  <p className="text-sm text-gray-500">@{helper.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleHelperEdit(helper)}
                    disabled={loading}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                    title="Edit Helper"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHelperDelete(helper.id)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Delete Helper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{helper.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(helper.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Helper Status and Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${helper.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {helper.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Expires:</span>
                  <span className={`text-xs ${new Date(helper.passwordExpiresAt) < new Date()
                    ? 'text-red-600 font-medium'
                    : new Date(helper.passwordExpiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
                      ? 'text-orange-600 font-medium'
                      : 'text-gray-600'
                    }`}>
                    {new Date(helper.passwordExpiresAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleToggleHelperStatus(helper.id)}
                    className={`flex-1 px-3 py-1 rounded-lg text-xs font-medium ${helper.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {helper.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleExtendHelperPassword(helper.id)}
                    className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium"
                  >
                    Extend Password
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {((activeTab === 'users' && filteredUsers.length === 0) || (activeTab === 'helpers' && filteredHelpers.length === 0)) && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {activeTab === 'users' ? 'No farmers found' : 'No helpers found'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingUser ? "Edit User" : "Add New User"}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                required
                placeholder="Enter user's full name"
                disabled={isSubmitting}
              />

              <FormInput
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phoneNumber}
                touched={touched.phoneNumber}
                required
                placeholder="Enter phone number"
                disabled={isSubmitting}
              />

              <FormTextarea
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.address}
                touched={touched.address}
                required
                placeholder="Enter complete address"
                rows={3}
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
                      {editingUser ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    `${editingUser ? "Update" : "Add"} User`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Helper Modal */}
      {isHelperModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingHelper ? "Edit Helper" : "Add New Helper"}</h2>

            <form onSubmit={handleHelperSubmit} className="space-y-4">
              <FormInput
                label="Name"
                name="name"
                value={helperFormData.name}
                onChange={handleHelperChange}
                onBlur={handleHelperBlur}
                error={helperErrors.name}
                touched={helperTouched.name}
                required
                placeholder="Enter helper's full name"
                disabled={isSubmitting}
              />

              <FormInput
                label="Username"
                name="username"
                value={helperFormData.username}
                onChange={handleHelperChange}
                onBlur={handleHelperBlur}
                error={helperErrors.username}
                touched={helperTouched.username}
                required
                placeholder="Enter username (letters, numbers, underscore only)"
                disabled={isSubmitting}
              />

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={helperFormData.password}
                onChange={handleHelperChange}
                onBlur={handleHelperBlur}
                error={helperErrors.password}
                touched={helperTouched.password}
                required={!editingHelper}
                placeholder={editingHelper ? "Leave blank to keep current password" : "Enter password (min 6 characters)"}
                disabled={isSubmitting}
              />

              <FormInput
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={helperFormData.phoneNumber}
                onChange={handleHelperChange}
                onBlur={handleHelperBlur}
                error={helperErrors.phoneNumber}
                touched={helperTouched.phoneNumber}
                required
                placeholder="Enter phone number"
                disabled={isSubmitting}
              />

              {!editingHelper && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Helper password will expire in 48 hours and can be extended by admin.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseHelperModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingHelper ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    `${editingHelper ? "Update" : "Create"} Helper`
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

interface UserDetailsProps {
  user: User
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, setSelectedUser }) => {
  // Helper function to format time in 12-hour format
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour24 = Number.parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? "PM" : "AM"
    return `${hour12}:${minutes} ${ampm}`
  }

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [minAmount, setMinAmount] = useState<number | null>(null)
  const [maxAmount, setMaxAmount] = useState<number | null>(null)
  const [minFat, setMinFat] = useState<number | null>(null)
  const [maxFat, setMaxFat] = useState<number | null>(null)
  // Removed sortColumn and sortOrder state
  const componentRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({
    totalLiters: 0,
    totalAmount: 0,
    totalAdvances: 0,
    netAmount: 0,
    avgFat: 0,
    collectionsCount: 0,
    advancesCount: 0,
  })
  const [collections, setCollections] = useState<import("../types").Collection[]>([])
  const [advances, setAdvances] = useState<import("../types").Advance[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const loadUserStats = async () => {
      setLoadingStats(true)
      try {
        // getUserStats should return { stats, collections, advances }
        const response = await apiService.getUserStats(user.id)
        const data = response.data || {}
        setStats(data.stats || {
          totalLiters: 0,
          totalAmount: 0,
          totalAdvances: 0,
          netAmount: 0,
          avgFat: 0,
          collectionsCount: 0,
          advancesCount: 0,
        })
        setCollections(data.collections || [])
        setAdvances(data.advances || [])
      } catch (error) {
        console.error('Error loading user stats:', error)
        setStats({
          totalLiters: 0,
          totalAmount: 0,
          totalAdvances: 0,
          netAmount: 0,
          avgFat: 0,
          collectionsCount: 0,
          advancesCount: 0,
        })
        setCollections([])
        setAdvances([])
      } finally {
        setLoadingStats(false)
      }
    }
    loadUserStats()
  }, [user.id])

  const filteredCollections = (collections || []).filter((collection) => {
    const collectionDate = new Date(collection.date)

    if (startDate) {
      const startOfDay = new Date(startDate)
      startOfDay.setHours(0, 0, 0, 0)
      if (collectionDate < startOfDay) return false
    }

    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      if (collectionDate > endOfDay) return false
    }

    if (minAmount !== null && collection.amount < minAmount) return false
    if (maxAmount !== null && collection.amount > maxAmount) return false
    if (minFat !== null && collection.fatPercentage < minFat) return false
    if (maxFat !== null && collection.fatPercentage > maxFat) return false
    return true
  })

  const filteredAdvances = (advances || []).filter((advance) => {
    const advanceDate = new Date(advance.date)

    if (startDate) {
      const startOfDay = new Date(startDate)
      startOfDay.setHours(0, 0, 0, 0)
      if (advanceDate < startOfDay) return false
    }

    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      if (advanceDate > endOfDay) return false
    }

    return true
  })

  const totalFilteredLiters = filteredCollections.reduce((sum, c) => sum + c.liters, 0)
  const totalFilteredAmount = filteredCollections.reduce((sum, c) => sum + c.amount, 0)
  const avgFilteredFat =
    filteredCollections.length > 0
      ? filteredCollections.reduce((sum, c) => sum + c.fatPercentage, 0) / filteredCollections.length
      : 0

  const handleGeneratePdf = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title></title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          html, body {
            font-family: Arial, sans-serif;
            margin: 5px;
            padding: 0;
            color: #333;
            line-height: 1.4;
            box-sizing: border-box;
            overflow-x: visible;
          }
          .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            border-bottom: 2px solid #333;
            padding-bottom: 2px;
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
          }
          .pdf-header-left {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 120px;
          }
          .pdf-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
            margin-bottom: 8px;
          }
          .pdf-center {
            flex: 1;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .pdf-header-right {
            text-align: right;
            min-width: 180px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
          }
          .pdf-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
          }
          .pdf-user-details {
            font-size: 16px;
            margin-bottom: 2px;
            color: #444;
          }
          .pdf-period {
            font-size: 14px;
            color: #666;
            margin-bottom: 2px;
          }
          .pdf-header-right-row {
            margin-bottom: 4px;
            font-size: 14px;
            color: #444;
          }
          .pdf-header-right-row strong {
            color: #333;
          }
          .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            box-sizing: border-box;
            max-width: 100%;
          }
          .metrics-table th,
          .metrics-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
          }
          .metrics-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 16px;
            box-sizing: border-box;
            max-width: 100%;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 2px;
            padding-left: 8px;
            padding-right: 8px;
            text-align: left;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin: 0px 0 8px 0; 
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          @media print { 
            body { margin: 1; }
            .pdf-header { page-break-after: avoid; }
            html, body { height: auto !important; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <div class="pdf-header-left">
             <div class="pdf-user-details"><strong>Farmer</strong>: ${user.name}</div>
             <div class="pdf-user-details"><strong>Phone</strong>: ${user.phoneNumber}</div>
             <div class="pdf-user-details"><strong>Address:</strong> ${user.address}</div>
          </div>
          <div class="pdf-center">
          <img src="https://live.staticflickr.com/65535/49403932201_b4f10e651e.jpg" alt="Logo" class="pdf-logo" />
            <div class="pdf-title">MSR Milk Center</div>
           </div>
          <div class="pdf-header-right">
            <div class="pdf-period"><strong>Report Period:</strong> ${startDate ? startDate.toLocaleDateString() : "All time"} - ${endDate ? endDate.toLocaleDateString() : "Present"}</div>
            <div class="pdf-header-right-row"><strong>Generated on:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
        <div class="section-title">Summary Statistics</div>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Collections</th>
              <th>Total Milk</th>
              <th>Avg Fat %</th>
              <th>Total Earned</th>
              <th>Total Advances</th>
              <th>Net Amount</th>
              
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${filteredCollections.length}</td>
              <td>${totalFilteredLiters.toFixed(1)} Liters</td>
              <td>${avgFilteredFat.toFixed(1)}%</td>
              <td>₹${totalFilteredAmount.toFixed(2)}</td>
              <td>₹${filteredAdvances.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}</td>
              <td><strong>₹${(totalFilteredAmount - filteredAdvances.reduce((sum, a) => sum + a.amount, 0)).toFixed(2)}</strong></td>

            </tr>
          </tbody>
        </table>

        <div class="section-title">Collection Records</div>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th class="text-right">Liters</th>
              <th class="text-center">Fat %</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCollections
        .map(
          (collection) => `
              <tr>
                <td>${new Date(collection.date).toLocaleDateString()} - ${formatTime(collection.time)}</td>
                <td class="text-right">${collection.liters}L</td>
                <td class="text-center">${collection.fatPercentage}%</td>
                <td class="text-right">₹${collection.rate}</td>
                <td class="text-right">₹${collection.amount.toFixed(2)} (${collection.isManuallyEdited ? "M" : "A"})</td>
              </tr>
            `,
        )
        .join("")}
          </tbody>
        </table>

        <div class="section-title">Advance Records</div>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAdvances.length > 0
        ? filteredAdvances
          .map(
            (advance) => `
                  <tr>
                    <td>${advance.date ? `${new Date(advance.date).toLocaleDateString()} - ${(() => { const d = new Date(advance.date); const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0'); const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; const ampm = h >= 12 ? 'PM' : 'AM'; return `${h12}:${m} ${ampm}`; })()}` : "Invalid Date"}</td>
                    <td class="text-right">₹${advance.amount.toFixed(2)}</td>
                    <td>${advance.description}</td>
                  </tr>
                `,
          )
          .join("")
        : `
                  <tr>
                    <td colspan="3" class="text-center" style="padding: 20px;">
                      No advances recorded for the selected period
                    </td>
                  </tr>
                `
      }
          </tbody>
        </table>
      </body>
    </html>
  `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }



  if (loadingStats) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedUser(null)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name} - Detailed Report</h1>
            <p className="text-gray-600">Loading user statistics...</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6" ref={componentRef}>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => setSelectedUser(null)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{user.name} - Detailed Report</h1>
              {user.isActive === false && (
                <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Account Deactivated
                </div>
              )}
            </div>
            <p className="text-gray-600">Complete overview of farmer's activity</p>
            {user.isActive === false && (
              <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-sm text-red-700">
                  <strong>Account Status:</strong> This user's account has been deactivated
                  {user.deactivatedAt && <span> on {new Date(user.deactivatedAt).toLocaleDateString()}</span>}
                  {user.deactivationReason && <span>. Reason: {user.deactivationReason}</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phoneNumber || 'No phone'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{user.address || 'No address'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown date'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Total Milk</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalLiters.toFixed(1)}L</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Total Earned</p>
              <p className="text-2xl font-bold text-green-900">₹{stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600">Total Advances</p>
              <p className="text-2xl font-bold text-red-900">₹{stats.totalAdvances.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600">Net Amount</p>
              <p className="text-2xl font-bold text-purple-900">₹{stats.netAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.collectionsCount}</p>
          <p className="text-sm text-gray-600">Total Collections</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.avgFat.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Average Fat %</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.advancesCount}</p>
          <p className="text-sm text-gray-600">Total Advances</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filter Collections & Advances</h2>
          <button
            onClick={() => {
              setStartDate(null)
              setEndDate(null)
              setMinAmount(null)
              setMaxAmount(null)
              setMinFat(null)
              setMaxFat(null)
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
          >
            Clear All Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split("T")[0] : ""}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split("T")[0] : ""}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minAmount === null ? "" : minAmount}
                onChange={(e) => setMinAmount(e.target.value ? Number.parseFloat(e.target.value) : null)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxAmount === null ? "" : maxAmount}
                onChange={(e) => setMaxAmount(e.target.value ? Number.parseFloat(e.target.value) : null)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fat % Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minFat === null ? "" : minFat}
                onChange={(e) => setMinFat(e.target.value ? Number.parseFloat(e.target.value) : null)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxFat === null ? "" : maxFat}
                onChange={(e) => setMaxFat(e.target.value ? Number.parseFloat(e.target.value) : null)}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>
          </div>


        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Ranges</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date()
                  setStartDate(today)
                  setEndDate(today)
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                  setStartDate(weekAgo)
                  setEndDate(today)
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                  setStartDate(monthAgo)
                  setEndDate(today)
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
                  setStartDate(firstDay);
                  setEndDate(now);
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12, 0, 0);
                  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                  setStartDate(lastMonth);
                  setEndDate(lastMonthEnd);
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Last Month
              </button>
            </div>
          </div>

          <button
            onClick={handleGeneratePdf}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>

      </div>

      {/* Filtered Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-blue-900">{filteredCollections.length}</p>
          <p className="text-sm text-blue-600">Filtered Collections</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-green-900">{totalFilteredLiters.toFixed(1)}L</p>
          <p className="text-sm text-green-600">Filtered Milk</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-red-900">{filteredAdvances.length}</p>
          <p className="text-sm text-red-600">Filtered Advances</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-purple-900">{avgFilteredFat.toFixed(1)}%</p>
          <p className="text-sm text-purple-600">Average Fat %</p>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Collections History</h2>
              <p className="text-sm text-gray-600">
                Showing {filteredCollections.length} of {stats.collectionsCount} total collections
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600 font-medium">
                Total Amount: ₹{totalFilteredAmount.toFixed(2)}
              </p>
            </div>
          </div>
          {/* Sorting controls removed */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fat %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCollections.slice(0, 10).map((collection: import("../types").Collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(collection.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(collection.time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{collection.liters}L</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{collection.fatPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{collection.rate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₹{collection.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.isManuallyEdited ? "Manual" : "Auto"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCollections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No collections recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Advances History */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Advances History</h2>
            <p className="text-sm text-gray-600">
              Showing {filteredAdvances.length} of {stats.advancesCount} total advances
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-red-600 font-medium">
              Total Advance: ₹{filteredAdvances.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAdvances.length > 0 ? (
                filteredAdvances.slice(0, 10).map((advance: import("../types").Advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advance.date ? `${new Date(advance.date).toLocaleDateString()} ${new Date(advance.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Invalid Date'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${advance.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{advance.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{advance.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <DollarSign className="w-12 h-12 text-gray-300 mb-2" />
                      <p>No advances recorded</p>
                      <p className="text-sm text-gray-400">
                        {stats.advancesCount > 0 ? "Try adjusting your date filters" : "No advances have been given to this farmer"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
