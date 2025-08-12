"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Search, Calendar, DollarSign, FileText, RefreshCw } from "lucide-react"
import type { User, Advance } from "../types"
import { getUsers, getAdvances, addAdvance } from "../utils/storage"
import { getCurrentDateIST, getCurrentDateStringIST, getCurrentTimeStringIST, formatDateTimeIST } from "../utils/timezone"
import { ErrorHandler } from "../utils/errorHandler"

const AdvanceManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    description: "",
    date: getCurrentDateStringIST(),
    time: getCurrentTimeStringIST(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [fetchedUsers, fetchedAdvances] = await Promise.all([
          getUsers(),
          getAdvances()
        ])
        setUsers(fetchedUsers || [])
        setAdvances(fetchedAdvances || [])
        console.log('Loaded advances:', fetchedAdvances)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredAdvances = (advances || [])
    .filter((advance) => {
      if (!advance) return false;

      const userName = String(advance.userName || '');
      const description = String(advance.description || '');
      const searchLower = String(searchTerm || '').toLowerCase();

      return userName.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = Number.parseFloat(formData.amount)
    if (isNaN(amount) || amount === 0) {
      setError('Please enter a valid amount (cannot be zero)')
      return
    }

    const user = users.find((u) => u.id === formData.userId)
    if (!user) {
      setError('Please select a valid farmer')
      return
    }

    // Check if user is active
    if (user.isActive === false) {
      setError('Cannot add advance for deactivated farmer. Please contact admin to reactivate the account.')
      return
    }

    if (!formData.description.trim()) {
      setError('Please provide a description')
      return
    }

    setLoading(true)
    try {
      const [year, month, day] = formData.date.split('-')
      const [hours, minutes] = formData.time.split(':')
      const advanceDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        0, // seconds
        0  // milliseconds
      ).toISOString()

      const newAdvance = await addAdvance({
        userId: formData.userId,
        userName: user.name,
        amount: amount,
        date: advanceDate, // Save with current IST time
        description: formData.description.trim(),
      });

      if (newAdvance) {
        setAdvances([newAdvance, ...advances]);
        resetForm();
      } else {
        setError('Failed to add advance. Please try again.')
      }
    } catch (error) {
      console.error('Error adding advance:', error)
      const errorInfo = ErrorHandler.handleApiError(error)
      setError(errorInfo.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      userId: "",
      amount: "",
      description: "",
      date: getCurrentDateStringIST(),
      time: getCurrentTimeStringIST(),
    })
    setError(null)
    setIsModalOpen(false)
  }

  const refreshData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fetchedUsers, fetchedAdvances] = await Promise.all([
        getUsers(),
        getAdvances()
      ])
      setUsers(fetchedUsers || [])
      setAdvances(fetchedAdvances || [])
    } catch (error) {
      console.error('Error refreshing data:', error)
      setError('Failed to refresh data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalAdvances = (advances || []).reduce((sum, advance) => {
    return sum + (advance?.amount || 0)
  }, 0)

  const totalAdvancesGiven = (advances || [])
    .filter(advance => (advance?.amount || 0) > 0)
    .reduce((sum, advance) => sum + (advance?.amount || 0), 0)

  const totalRepaymentsReceived = (advances || [])
    .filter(advance => (advance?.amount || 0) < 0)
    .reduce((sum, advance) => sum + Math.abs(advance?.amount || 0), 0)

  const thisMonthAdvances = (advances || [])
    .filter((advance) => {
      if (!advance?.date) return false
      try {
        const advanceDate = new Date(advance.date)
        const currentIST = getCurrentDateIST()
        return advanceDate.getMonth() === currentIST.getMonth() && advanceDate.getFullYear() === currentIST.getFullYear()
      } catch {
        return false
      }
    })
    .reduce((sum, advance) => sum + (advance?.amount || 0), 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Advance Management</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-600 text-sm">Loading...</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-600">Advances Given</p>
                <p className="text-2xl font-bold text-red-900">₹{totalAdvancesGiven.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Repayments Received</p>
                <p className="text-2xl font-bold text-green-900">₹{totalRepaymentsReceived.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Net Outstanding</p>
                <p className={`text-2xl font-bold ${totalAdvances >= 0 ? 'text-blue-900' : 'text-green-900'}`}>
                  ₹{totalAdvances.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">This Month Net</p>
                <p className={`text-2xl font-bold ${thisMonthAdvances >= 0 ? 'text-orange-900' : 'text-green-900'}`}>
                  ₹{thisMonthAdvances.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions by farmer or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaction Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdvances.map((advance) => {
                if (!advance || !advance.id) return null;

                return (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {advance.userName || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {advance.date ? formatDateTimeIST(new Date(advance.date)) : 'Invalid Date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`${(advance.amount || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(advance.amount || 0) >= 0 ? '+' : ''}₹{(advance.amount || 0).toFixed(2)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {(advance.amount || 0) >= 0 ? 'Advance' : 'Repayment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {advance.description || 'No description'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAdvances.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No transactions match your search' : 'No transactions recorded yet'}
            </p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Click "Add Transaction" to record the first transaction'}
            </p>
          </div>
        )}
      </div>

      {/* Add Advance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Modal Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
                <select
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a farmer</option>
                  {users.filter(user => user.isActive !== false).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount (positive for advance, negative for repayment)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positive amounts = Advance given to farmer<br />
                  Negative amounts = Repayment received from farmer
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Reason for advance..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvanceManagement
