"use client"

import { useState, useEffect, useMemo } from "react"
import {
  TrendingUp,
  Users,
  Droplets,
  DollarSign,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  X,
  Star,
  Award,
  Target,
  Percent,
  RefreshCw,
} from "lucide-react"
import type { Collection, User } from "../types"
import { getCollections, getUsers } from "../utils/storage"
import { eventBus, EVENTS } from "../utils/eventBus"

// Helper function to format time in 12-hour format
const formatTime = (time: string) => {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour24 = Number.parseInt(hours)
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const ampm = hour24 >= 12 ? "PM" : "AM"
  return `${hour12}:${minutes} ${ampm}`
}


export default function Reports() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "farmers" | "daily" | "performance">("overview")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "lastmonth" | "quarter" | "year" | "custom">("month")
  const [selectedFarmer, setSelectedFarmer] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })

  // Advanced filters
  const [filters, setFilters] = useState({
    minFat: "",
    maxFat: "",
    minAmount: "",
    maxAmount: "",
    minLiters: "",
    maxLiters: "",
    collectionType: "all", // all, manual, auto
    sortBy: "date", // date, amount, liters, fat
    sortOrder: "desc" as "asc" | "desc",
  })

  // PDF Export Options
  const [showPdfOptions, setShowPdfOptions] = useState(false)
  const [pdfOptions, setPdfOptions] = useState({
    summaryMetrics: true,
    dailyPerformance: false,
    recentCollections: false,
    monthlyMetrics: true,
    userPerformance: true,
    userDetails: false,
  })

  // Check if PDF options should be available (quarter, year, custom only)
  const shouldShowPdfOptions = () => {
    return timeRange === "quarter" || timeRange === "year" || timeRange === "custom"
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [fetchedCollections, fetchedUsers] = await Promise.all([
        getCollections(),
        getUsers()
      ])
      console.log('Fetched collections:', fetchedCollections)
      console.log('Fetched users:', fetchedUsers)



      setCollections(fetchedCollections)
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load analytics data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Add window focus listener to refresh data when user comes back to the tab
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Listen for user updates to refresh data
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log('User updated, refreshing reports data...')
      loadData()
    }

    const handleDataRefresh = () => {
      console.log('Data refresh needed, refreshing reports data...')
      loadData()
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

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = new Date()

    switch (timeRange) {
      case "week":
        // Get start of current week (Monday)
        const dayOfWeek = now.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0)
        endDate = now
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)

        endDate = now
        break
      case "lastmonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) // Last day of previous month
        break
      case "quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1, 12, 0, 0)
        endDate = now
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1, 12, 0, 0)
        endDate = now
        break
      case "custom":
        startDate = new Date(customDateRange.startDate + "T12:00:00")
        endDate = new Date(customDateRange.endDate + "T23:59:59")
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)
        endDate = now
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      startDateTime: startDate,
      endDateTime: endDate,
    }
  }

  // Get active farmers from last 2 months
  const getActiveFarmersLast2Months = () => {
    const now = new Date()
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    const recentCollections = collections.filter(collection => {
      const collectionDate = new Date(collection.date)
      return collectionDate >= twoMonthsAgo && collectionDate <= now
    })

    return new Set(recentCollections.map(c => c.userId)).size
  }

  const dateRange = getDateRange()

  // Enhanced filtering with useMemo for performance
  const filteredCollections = useMemo(() => {


    let filtered = (collections || []).filter((collection) => {
      // Date filter
      const collectionDate = new Date(collection.date)
      if (collection.time) {
        const [h, m, s] = collection.time.split(":").map(Number)
        collectionDate.setHours(h || 0, m || 0, s || 0)
      }
      const dateMatch = collectionDate >= dateRange.startDateTime && collectionDate <= dateRange.endDateTime

      // Farmer filter
      let farmerMatch = true
      if (selectedFarmer && selectedFarmer !== "" && selectedFarmer !== "all") {
        farmerMatch = String(collection.userId) === String(selectedFarmer)


      }

      // Search filter
      let searchMatch = true
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        searchMatch =
          collection.userName.toLowerCase().includes(searchLower) ||
          collection.date.includes(searchTerm) ||
          collection.liters.toString().includes(searchTerm) ||
          collection.fatPercentage.toString().includes(searchTerm) ||
          collection.amount.toString().includes(searchTerm)
      }

      // Advanced filters
      let advancedMatch = true

      // Fat percentage filter
      if (filters.minFat && collection.fatPercentage < parseFloat(filters.minFat)) advancedMatch = false
      if (filters.maxFat && collection.fatPercentage > parseFloat(filters.maxFat)) advancedMatch = false

      // Amount filter
      if (filters.minAmount && collection.amount < parseFloat(filters.minAmount)) advancedMatch = false
      if (filters.maxAmount && collection.amount > parseFloat(filters.maxAmount)) advancedMatch = false

      // Liters filter
      if (filters.minLiters && collection.liters < parseFloat(filters.minLiters)) advancedMatch = false
      if (filters.maxLiters && collection.liters > parseFloat(filters.maxLiters)) advancedMatch = false

      // Collection type filter
      if (filters.collectionType === "manual" && !collection.isManuallyEdited) advancedMatch = false
      if (filters.collectionType === "auto" && collection.isManuallyEdited) advancedMatch = false

      return dateMatch && farmerMatch && searchMatch && advancedMatch
    })

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.date + " " + a.time).getTime()
          bValue = new Date(b.date + " " + b.time).getTime()
          break
        case "amount":
          aValue = a.amount
          bValue = b.amount
          break
        case "liters":
          aValue = a.liters
          bValue = b.liters
          break
        case "fat":
          aValue = a.fatPercentage
          bValue = b.fatPercentage
          break
        default:
          aValue = new Date(a.date + " " + a.time).getTime()
          bValue = new Date(b.date + " " + b.time).getTime()
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })



    return filtered
  }, [collections, dateRange, selectedFarmer, searchTerm, filters])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFarmer, searchTerm, filters, timeRange])

  // Close PDF options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPdfOptions && !(event.target as Element).closest('.pdf-options-container')) {
        setShowPdfOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPdfOptions])

  // Pagination
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage)
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate key metrics
  const metrics = useMemo(() => {
    const activeFarmersLast2Months = getActiveFarmersLast2Months()

    return {
      totalLiters: filteredCollections.reduce((sum, c) => sum + c.liters, 0),
      totalAmount: filteredCollections.reduce((sum, c) => sum + c.amount, 0),
      totalCollections: filteredCollections.length,
      averageFat:
        filteredCollections.length > 0
          ? filteredCollections.reduce((sum, c) => sum + c.fatPercentage, 0) / filteredCollections.length
          : 0,
      activeFarmersInPeriod: new Set(filteredCollections.map((c) => c.userId)).size,
      activeFarmersLast2Months,
      averagePerCollection:
        filteredCollections.length > 0
          ? filteredCollections.reduce((sum, c) => sum + c.amount, 0) / filteredCollections.length
          : 0,
      averageLitersPerCollection:
        filteredCollections.length > 0
          ? filteredCollections.reduce((sum, c) => sum + c.liters, 0) / filteredCollections.length
          : 0,
      manualCollections: filteredCollections.filter(c => c.isManuallyEdited).length,
      autoCollections: filteredCollections.filter(c => !c.isManuallyEdited).length,
    }
  }, [filteredCollections, collections])

  // Calculate growth compared to previous period
  const getPreviousPeriodData = () => {
    const periodLength = new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()
    const previousStart = new Date(new Date(dateRange.startDate).getTime() - periodLength).toISOString().split("T")[0]
    const previousEnd = new Date(new Date(dateRange.startDate).getTime() - 1).toISOString().split("T")[0]

    const previousCollections = (collections || []).filter((c) => c.date >= previousStart && c.date <= previousEnd)

    return {
      totalAmount: previousCollections.reduce((sum, c) => sum + c.amount, 0),
      totalLiters: previousCollections.reduce((sum, c) => sum + c.liters, 0),
      totalCollections: previousCollections.length,
    }
  }

  const previousPeriod = getPreviousPeriodData()
  const growth = {
    amount:
      previousPeriod.totalAmount > 0
        ? ((metrics.totalAmount - previousPeriod.totalAmount) / previousPeriod.totalAmount) * 100
        : 0,
    liters:
      previousPeriod.totalLiters > 0
        ? ((metrics.totalLiters - previousPeriod.totalLiters) / previousPeriod.totalLiters) * 100
        : 0,
    collections:
      previousPeriod.totalCollections > 0
        ? ((metrics.totalCollections - previousPeriod.totalCollections) / previousPeriod.totalCollections) * 100
        : 0,
  }

  // Enhanced farmer statistics with performance metrics
  const farmerStats = useMemo(() => {
    return users
      .map((user) => {
        const userCollections = filteredCollections.filter((c) => c.userId === user.id)
        const allUserCollections = collections.filter((c) => c.userId === user.id)

        // Calculate consistency (collections in last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentCollections = allUserCollections.filter(c =>
          new Date(c.date) >= thirtyDaysAgo
        )

        // Calculate quality score based on fat percentage consistency
        const fatPercentages = userCollections.map(c => c.fatPercentage)
        const avgFat = fatPercentages.length > 0
          ? fatPercentages.reduce((sum, fat) => sum + fat, 0) / fatPercentages.length
          : 0
        const fatVariance = fatPercentages.length > 1
          ? fatPercentages.reduce((sum, fat) => sum + Math.pow(fat - avgFat, 2), 0) / fatPercentages.length
          : 0
        const qualityScore = Math.max(0, 100 - (fatVariance * 10)) // Lower variance = higher quality

        return {
          ...user,
          totalLiters: userCollections.reduce((sum, c) => sum + c.liters, 0),
          totalAmount: userCollections.reduce((sum, c) => sum + c.amount, 0),
          collections: userCollections.length,
          avgFat,
          avgLitersPerCollection: userCollections.length > 0
            ? userCollections.reduce((sum, c) => sum + c.liters, 0) / userCollections.length
            : 0,
          avgAmountPerCollection: userCollections.length > 0
            ? userCollections.reduce((sum, c) => sum + c.amount, 0) / userCollections.length
            : 0,
          consistency: recentCollections.length,
          qualityScore,
          manualEdits: userCollections.filter(c => c.isManuallyEdited).length,
          lastCollection: userCollections.length > 0
            ? userCollections.sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime())[0].date
            : null,
        }
      })
      .filter((stat) => stat.collections > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [users, filteredCollections, collections])

  // Daily data for trends
  const dailyData = filteredCollections.reduce(
    (acc, collection) => {
      const date = collection.date
      if (!acc[date]) {
        acc[date] = { date, liters: 0, amount: 0, collections: 0, farmers: new Set() }
      }
      acc[date].liters += collection.liters
      acc[date].amount += collection.amount
      acc[date].collections += 1
      acc[date].farmers.add(collection.userId)
      return acc
    },
    {} as Record<string, { date: string; liters: number; amount: number; collections: number; farmers: Set<string> }>,
  )

  const dailyStats = Object.values(dailyData)
    .map((day) => ({ ...day, farmers: day.farmers.size }))
    .sort((a, b) => b.date.localeCompare(a.date))

  // Monthly data for extended reports
  const monthlyData = useMemo(() => {
    const monthlyStats = filteredCollections.reduce((acc, collection) => {
      const date = new Date(collection.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          liters: 0,
          amount: 0,
          collections: 0,
          farmers: new Set(),
          avgFat: 0,
          fatSum: 0
        }
      }

      acc[monthKey].liters += collection.liters
      acc[monthKey].amount += collection.amount
      acc[monthKey].collections += 1
      acc[monthKey].farmers.add(collection.userId)
      acc[monthKey].fatSum += collection.fatPercentage

      return acc
    }, {} as Record<string, any>)

    return Object.values(monthlyStats)
      .map((month: any) => ({
        ...month,
        farmers: month.farmers.size,
        avgFat: month.collections > 0 ? month.fatSum / month.collections : 0,
        avgPerCollection: month.collections > 0 ? month.amount / month.collections : 0
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
  }, [filteredCollections])

  // Top performing users for extended reports
  const topUsers = useMemo(() => {
    return farmerStats.slice(0, 10).map(user => ({
      ...user,
      efficiency: user.collections > 0 ? (user.totalAmount / user.collections) : 0,
      reliability: user.consistency / 30 * 100 // percentage based on 30 days
    }))
  }, [farmerStats])

  // Utility functions
  const clearAllFilters = () => {
    setSelectedFarmer("")
    setSearchTerm("")
    setFilters({
      minFat: "",
      maxFat: "",
      minAmount: "",
      maxAmount: "",
      minLiters: "",
      maxLiters: "",
      collectionType: "all",
      sortBy: "date",
      sortOrder: "desc",
    })
    setCurrentPage(1)
  }



  // Export functions
  const generatePDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Generate sections based on selected options
    const summaryMetricsSection = pdfOptions.summaryMetrics ? `
      <div class="section-title">Summary Metrics</div>
      <table class="metrics-table">
        <thead>
          <tr>
            <th>Total Milk Collected</th>
            <th>Total Revenue</th>
            <th>Total Collections</th>
            <th>Active Farmers (Period)</th>
            <th>Active Farmers (2 Months)</th>
            <th>Average Fat %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${metrics.totalLiters.toFixed(1)} Liters</td>
            <td>₹${metrics.totalAmount.toFixed(2)}</td>
            <td>${metrics.totalCollections}</td>
            <td>${metrics.activeFarmersInPeriod}</td>
            <td>${metrics.activeFarmersLast2Months}</td>
            <td>${metrics.averageFat.toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    ` : ''

    const dailyPerformanceSection = pdfOptions.dailyPerformance ? `
      <div class="section-title">Daily Performance Summary</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Collections</th>
            <th>Farmers</th>
            <th>Total Liters</th>
            <th>Total Amount</th>
            <th>Avg per Collection</th>
          </tr>
        </thead>
        <tbody>
          ${dailyStats
        .slice(0, 20)
        .map(
          (day) => `
                <tr>
                  <td>${new Date(day.date).toLocaleDateString()}</td>
                  <td>${new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</td>
                  <td class="text-center">${day.collections}</td>
                  <td class="text-center">${day.farmers}</td>
                  <td class="text-right">${day.liters.toFixed(1)}L</td>
                  <td class="text-right">₹${day.amount.toFixed(2)}</td>
                  <td class="text-right">₹${(day.amount / day.collections).toFixed(2)}</td>
                </tr>
              `,
        )
        .join("")}
        </tbody>
      </table>
    ` : ''

    const recentCollectionsSection = pdfOptions.recentCollections && filteredCollections.length > 0 ? `
      <div class="section-title">Recent Collections</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Farmer</th>
            <th>Liters</th>
            <th>Fat %</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCollections
        .slice(0, 25)
        .map(
          (collection) => `
                <tr>
                  <td>${new Date(collection.date).toLocaleDateString()}</td>
                  <td>${formatTime(collection.time)}</td>
                  <td>${collection.userName}</td>
                  <td class="text-right">${collection.liters}L</td>
                  <td class="text-center">${collection.fatPercentage}%</td>
                  <td class="text-right">₹${collection.rate}</td>
                  <td class="text-right">₹${collection.amount.toFixed(2)}</td>
                </tr>
              `,
        )
        .join("")}
        </tbody>
      </table>
    ` : ''

    const monthlyMetricsSection = pdfOptions.monthlyMetrics ? `
      <div class="section-title">Monthly Performance Metrics</div>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Collections</th>
            <th>Active Farmers</th>
            <th>Total Liters</th>
            <th>Total Revenue</th>
            <th>Avg Fat %</th>
            <th>Avg per Collection</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyData
        .map(
          (month) => `
                <tr>
                  <td>${new Date(month.month + '-01').toLocaleDateString("en-US", { year: "numeric", month: "long" })}</td>
                  <td class="text-center">${month.collections}</td>
                  <td class="text-center">${month.farmers}</td>
                  <td class="text-right">${month.liters.toFixed(1)}L</td>
                  <td class="text-right">₹${month.amount.toFixed(2)}</td>
                  <td class="text-center">${month.avgFat.toFixed(1)}%</td>
                  <td class="text-right">₹${month.avgPerCollection.toFixed(2)}</td>
                </tr>
              `,
        )
        .join("")}
        </tbody>
      </table>
    ` : ''

    const userPerformanceSection = pdfOptions.userPerformance ? `
      <div class="section-title">Top Farmer Performance</div>
      <table>
        <thead>
          <tr>
            <th>Farmer</th>
            <th>Collections</th>
            <th>Total Liters</th>
            <th>Total Revenue</th>
            <th>Avg Fat %</th>
            <th>Quality Score</th>
            <th>Consistency (30 days)</th>
          </tr>
        </thead>
        <tbody>
          ${topUsers
        .map(
          (user) => `
                <tr>
                  <td>${user.name}</td>
                  <td class="text-center">${user.collections}</td>
                  <td class="text-right">${user.totalLiters.toFixed(1)}L</td>
                  <td class="text-right">₹${user.totalAmount.toFixed(2)}</td>
                  <td class="text-center">${user.avgFat.toFixed(1)}%</td>
                  <td class="text-center">${user.qualityScore.toFixed(0)}/100</td>
                  <td class="text-center">${user.consistency} days</td>
                </tr>
              `,
        )
        .join("")}
        </tbody>
      </table>
    ` : ''

    const userDetailsSection = pdfOptions.userDetails ? `
      <div class="section-title">Farmer Details</div>
      <table>
        <thead>
          <tr>
            <th>Farmer</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Collections</th>
            <th>Last Collection</th>
            <th>Manual Edits</th>
          </tr>
        </thead>
        <tbody>
          ${farmerStats
        .map(
          (user) => `
                <tr>
                  <td>${user.name}</td>
                  <td>${user.phoneNumber}</td>
                  <td>${user.address}</td>
                  <td class="text-center">${user.collections}</td>
                  <td>${user.lastCollection ? new Date(user.lastCollection).toLocaleDateString() : 'N/A'}</td>
                  <td class="text-center">${user.manualEdits}</td>
                </tr>
              `,
        )
        .join("")}
        </tbody>
      </table>
    ` : ''

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MSR Milk Center - Analytics Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333; 
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              color: #333;
            }
            .header p { 
              margin: 5px 0; 
              font-size: 14px;
              color: #666;
            }
            .info-section {
              margin-bottom: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .metrics-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
              font-size: 13px;
            }
            .metrics-table th,
            .metrics-table td {
              border: 1px solid #ddd;
              padding: 2px 3px;
              text-align: center;
              font-size: 11px;
            }
            .metrics-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 12px;
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 2px 3px;
              text-align: left;
              font-size: 11px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 30px 0 15px 0; 
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            @media print { 
              body { margin: 0; }
              .header { page-break-after: avoid; }
              .section-title { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MSR Milk Center</h1>
            <p>Analytics Report</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="info-section">
            <strong>Report Period:</strong> ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}<br>
            <strong>Total Records:</strong> ${filteredCollections.length} collections<br>
            ${selectedFarmer ? `<strong>Farmer:</strong> ${users.find((u) => u.id === selectedFarmer)?.name}<br>` : ""}
            <strong>Report Type:</strong> ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Summary
          </div>

          ${summaryMetricsSection}
          ${monthlyMetricsSection}
          ${userPerformanceSection}
          ${dailyPerformanceSection}
          ${recentCollectionsSection}
          ${userDetailsSection}
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const timeRangeLabels = {
    week: "This Week",
    month: "This Month",
    lastmonth: "Last Month",
    quarter: "This Quarter",
    year: "This Year",
    custom: "Custom Range",
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your milk collection business</p>

          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">


            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${showFilters ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-200`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* PDF Export Button with Options */}
              <div className="relative pdf-options-container">
                {shouldShowPdfOptions() ? (
                  <div>
                    <button
                      onClick={() => setShowPdfOptions(!showPdfOptions)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      PDF Options
                      {showPdfOptions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {showPdfOptions && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">PDF Export Options</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setPdfOptions({
                                summaryMetrics: true,
                                dailyPerformance: true,
                                recentCollections: true,
                                monthlyMetrics: true,
                                userPerformance: true,
                                userDetails: true,
                              })}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              All
                            </button>
                            <span className="text-xs text-gray-400">|</span>
                            <button
                              onClick={() => setPdfOptions({
                                summaryMetrics: false,
                                dailyPerformance: false,
                                recentCollections: false,
                                monthlyMetrics: false,
                                userPerformance: false,
                                userDetails: false,
                              })}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              None
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.summaryMetrics}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, summaryMetrics: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Summary Metrics</span>
                          </label>


                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.monthlyMetrics}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, monthlyMetrics: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Monthly Metrics</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.userPerformance}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, userPerformance: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">User Performance</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.dailyPerformance}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, dailyPerformance: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Daily Performance Summary</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.recentCollections}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, recentCollections: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Recent Collections</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pdfOptions.userDetails}
                              onChange={(e) => setPdfOptions(prev => ({ ...prev, userDetails: e.target.checked }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">User Details</span>
                          </label>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              generatePDF()
                              setShowPdfOptions(false)
                            }}
                            className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Generate PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={generatePDF}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters & Options</h3>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="lastmonth">Last Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farmer</label>
                <select
                  value={selectedFarmer}
                  onChange={(e) => setSelectedFarmer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Farmers</option>
                  {users.filter(user => user.isActive !== false).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Type</label>
                <select
                  value={filters.collectionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, collectionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="auto">Auto Calculated</option>
                  <option value="manual">Manually Edited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="liters">Liters</option>
                    <option value="fat">Fat %</option>
                  </select>
                  <button
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
                  >
                    {filters.sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>

              {timeRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fat Percentage Range</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minFat}
                      onChange={(e) => setFilters(prev => ({ ...prev, minFat: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.1"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxFat}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxFat: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="min-w-0 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range (₹)</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="min-w-0 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Liters Range</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minLiters}
                      onChange={(e) => setFilters(prev => ({ ...prev, minLiters: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.1"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxLiters}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxLiters: e.target.value }))}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-800">
                <Eye className="w-4 h-4" />
                <span className="font-medium">Viewing:</span>
                <span>{timeRangeLabels[timeRange]}</span>
                {selectedFarmer && (
                  <>
                    <span>•</span>
                    <span>{users.find((u) => u.id === selectedFarmer)?.name}</span>
                  </>
                )}
                <span>•</span>
                <span>{filteredCollections.length} collections</span>
                <span>•</span>
                <span>
                  {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
                  {new Date(dateRange.endDate).toLocaleDateString()}
                </span>
                {searchTerm && (
                  <>
                    <span>•</span>
                    <span>Search: "{searchTerm}"</span>
                  </>
                )}
              </div>


            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">₹{metrics.totalAmount.toFixed(0)}</p>
              {growth.amount !== 0 && (
                <p
                  className={`text-sm flex items-center gap-1 mt-2 ${growth.amount > 0 ? "text-green-200" : "text-red-200"}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {growth.amount > 0 ? "+" : ""}
                  {growth.amount.toFixed(1)}% vs last period
                </p>
              )}
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Milk</p>
              <p className="text-3xl font-bold">{metrics.totalLiters.toFixed(1)}L</p>
              {growth.liters !== 0 && (
                <p
                  className={`text-sm flex items-center gap-1 mt-2 ${growth.liters > 0 ? "text-green-200" : "text-red-200"}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {growth.liters > 0 ? "+" : ""}
                  {growth.liters.toFixed(1)}% vs last period
                </p>
              )}
            </div>
            <Droplets className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Collections</p>
              <p className="text-3xl font-bold">{metrics.totalCollections}</p>
              {growth.collections !== 0 && (
                <p
                  className={`text-sm flex items-center gap-1 mt-2 ${growth.collections > 0 ? "text-green-200" : "text-red-200"}`}
                >
                  <Activity className="w-4 h-4" />
                  {growth.collections > 0 ? "+" : ""}
                  {growth.collections.toFixed(1)}% vs last period
                </p>
              )}
            </div>
            <BarChart3 className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Farmers (Last 2 Months)</p>
              <p className="text-3xl font-bold">{metrics.activeFarmersLast2Months}</p>
              <p className="text-sm text-orange-200 mt-2">
                {metrics.activeFarmersInPeriod} in current period
              </p>
            </div>
            <Users className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "farmers", label: "Farmer Rankings", icon: Users },
              { id: "performance", label: "Performance Analytics", icon: Target },
              { id: "daily", label: "Daily Records", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Average Fat Content</span>
                  <span className="font-semibold text-gray-900">{metrics.averageFat.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Revenue per Liter</span>
                  <span className="font-semibold text-gray-900">
                    ₹{metrics.totalLiters > 0 ? (metrics.totalAmount / metrics.totalLiters).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Collections per Day</span>
                  <span className="font-semibold text-gray-900">
                    {dailyStats.length > 0 ? (metrics.totalCollections / dailyStats.length).toFixed(1) : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Top Farmer Contribution</span>
                  <span className="font-semibold text-gray-900">
                    {farmerStats.length > 0
                      ? ((farmerStats[0].totalAmount / metrics.totalAmount) * 100).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {filteredCollections.slice(0, 5).map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{collection.userName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(collection.date).toLocaleDateString()} • {formatTime(collection.time)} •{" "}
                        {collection.liters}L • {collection.fatPercentage}%
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">₹{collection.amount.toFixed(2)}</span>
                  </div>
                ))}
                {filteredCollections.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No collections found for the selected period</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "farmers" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Farmer Performance Ranking
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 rounded-t-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collections
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Liters
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Fat %
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farmerStats.map((farmer, index) => (
                    <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                              ? "bg-gray-100 text-gray-800"
                              : index === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{farmer.name}</div>
                        <div className="text-sm text-gray-500">{farmer.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{farmer.collections}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {farmer.totalLiters.toFixed(1)}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{farmer.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{farmer.avgFat.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${farmer.qualityScore >= 80 ? 'bg-green-500' :
                            farmer.qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          <span className="text-sm text-gray-900">{farmer.qualityScore.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((farmer.totalAmount / (farmerStats[0]?.totalAmount || 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {((farmer.totalAmount / (farmerStats[0]?.totalAmount || 1)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {farmerStats.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No farmer data available for the selected period</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg per Collection</p>
                    <p className="text-2xl font-bold text-gray-900">₹{metrics.averagePerCollection.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg Liters/Collection</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.averageLitersPerCollection.toFixed(1)}L</p>
                  </div>
                  <Droplets className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Manual Edits</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.manualCollections}</p>
                    <p className="text-xs text-gray-500">
                      {metrics.totalCollections > 0 ? ((metrics.manualCollections / metrics.totalCollections) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                  <Percent className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Revenue/Liter</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{metrics.totalLiters > 0 ? (metrics.totalAmount / metrics.totalLiters).toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Performers (Revenue)
                </h3>
                <div className="space-y-3">
                  {farmerStats.slice(0, 5).map((farmer, index) => (
                    <div key={farmer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-yellow-100 text-yellow-800" :
                          index === 1 ? "bg-gray-100 text-gray-800" :
                            index === 2 ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{farmer.name}</p>
                          <p className="text-sm text-gray-500">{farmer.collections} collections</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{farmer.totalAmount.toFixed(0)}</p>
                        <p className="text-sm text-gray-500">{farmer.totalLiters.toFixed(1)}L</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-500" />
                  Quality Leaders (Fat %)
                </h3>
                <div className="space-y-3">
                  {farmerStats
                    .sort((a, b) => b.avgFat - a.avgFat)
                    .slice(0, 5)
                    .map((farmer) => (
                      <div key={farmer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${farmer.qualityScore >= 80 ? 'bg-green-500' :
                            farmer.qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{farmer.name}</p>
                            <p className="text-sm text-gray-500">Quality: {farmer.qualityScore.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{farmer.avgFat.toFixed(1)}%</p>
                          <p className="text-sm text-gray-500">{farmer.collections} collections</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "daily" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Daily Collection Records
                <span className="ml-2 text-sm font-normal text-blue-600">({filteredCollections.length} records)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 rounded-t-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liters
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fat %
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCollections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {new Date(collection.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(collection.date).toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{formatTime(collection.time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{collection.userName}</div>
                        <div className="text-sm text-gray-500">
                          {users.find((u) => u.id === collection.userId)?.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {collection.liters}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {collection.fatPercentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{collection.rate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        <div className="flex items-center space-x-2">
                          <span>₹{collection.amount.toFixed(2)}</span>
                          {collection.isManuallyEdited && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-bold">
                              M
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {collection.isManuallyEdited ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Manual
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Auto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCollections.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No collection records available for the selected period</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCollections.length)} of {filteredCollections.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm border rounded-lg transition-colors ${currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-white'
                              }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
