"use client"

import { useState, useEffect } from "react"
import { Users, Milk, FileText, DollarSign, Settings, LogOut, Menu, X } from "lucide-react"
import UsersPage from "./components/UsersPage"
import MilkCollection from "./components/MilkCollection"
import Reports from "./components/Reports"
import AdvanceManagement from "./components/AdvanceManagement"
import FatRatesPage from "./components/FatRatesPage"
import ProtectedRoute from "./components/ProtectedRoute"
import { AlertProvider, useAlert } from "./contexts/AlertContext"
import AlertContainer from "./components/AlertContainer"
import { authService } from "./utils/auth"
import { eventBus, EVENTS } from "./utils/eventBus"

type Page = "users" | "collection" | "reports" | "advances" | "fatrates"

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("collection")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { showConfirmation, showError } = useAlert()

  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    const handleAccessDenied = (event: any) => {
      console.warn('Access denied detected:', event)

      showError(
        'Your access has been revoked due to insufficient permissions. You will be logged out automatically.',
        'Access Denied',
        {
          persistent: true,
          actions: [{
            label: 'Contact Administrator',
            onClick: () => {
              console.log('Contact administrator requested')
            },
            style: 'primary' as const
          }]
        }
      )

      setTimeout(() => {
        authService.forceLogout()
      }, 3000)
    }

    eventBus.on(EVENTS.USER_ACCESS_DENIED, handleAccessDenied)

    return () => {
      eventBus.off(EVENTS.USER_ACCESS_DENIED, handleAccessDenied)
    }
  }, [showError])

  const allNavigation = [
    { id: "collection" as Page, name: "Milk Collection", icon: Milk, roles: ["admin", "user", "helper"] },
    { id: "users" as Page, name: "Users", icon: Users, roles: ["admin", "user"] },
    { id: "reports" as Page, name: "Reports", icon: FileText, roles: ["admin", "user"] },
    { id: "advances" as Page, name: "Advances", icon: DollarSign, roles: ["admin", "user"] },
    { id: "fatrates" as Page, name: "Fat Rates", icon: Settings, roles: ["admin", "user"] },
  ]

  const navigation = allNavigation.filter(item =>
    currentUser?.role && item.roles.includes(currentUser.role)
  )

  const handleLogout = async () => {
    setIsMobileMenuOpen(false)
    showConfirmation(
      "Are you sure you want to logout?",
      async () => {
        await authService.logout()
        window.location.reload()
      }
    )
  }

  const handleMenuItemClick = (pageId: Page) => {
    setCurrentPage(pageId)
    setIsMobileMenuOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case "users":
        return <UsersPage />
      case "collection":
        return <MilkCollection />
      case "reports":
        return <Reports />
      case "advances":
        return <AdvanceManagement />
      case "fatrates":
        return <FatRatesPage />
      default:
        return <MilkCollection />
    }
  }

  const currentPageData = navigation.find((item) => item.id === currentPage)
  const CurrentPageIcon = currentPageData?.icon || Milk

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 w-full">
              <div className="flex items-center min-w-0 flex-shrink-0">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors mr-2"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
                <CurrentPageIcon className="w-6 h-6 text-blue-600 mr-2" />
                <span className="hidden sm:inline text-base font-semibold text-gray-700 truncate max-w-[120px] sm:max-w-[180px]">{currentPageData?.name}</span>
              </div>

              <div className="flex flex-col items-center flex-1 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                <div className="flex items-center">
                  <img
                    src="/images/lord-venkatesa-logo.jpg"
                    alt="Lord Ganesha"
                    className="h-10 w-10 mr-2 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                  <h1 className="hidden sm:block text-xl font-bold text-gray-900 whitespace-nowrap">MSR Milk Center</h1>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 rounded-xl text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors text-sm font-medium"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div
            className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 rounded-r-2xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              } overflow-y-auto max-h-screen`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">

                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src="/images/lord-venkatesa-logo.jpg"
                  alt="Lord Ganesha"
                  className="h-8 w-8 mr-2 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                <div>
                  <p className="text-xl font-medium text-gray-900 capitalize">{currentUser?.username}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {currentUser?.role}
                    {currentUser?.role === 'helper' && (
                      <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Limited Access
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full flex items-center p-3 text-left text-sm font-medium transition-colors rounded-xl ${isActive
                      ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                    {item.name}
                    {isActive && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>}
                  </button>
                )
              })}
            </div>

          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{renderPage()}</main>
      </div>
      <AlertContainer />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  )
}

export default App
