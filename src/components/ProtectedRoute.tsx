"use client"

import type { ReactNode } from "react"
import { authService } from "../utils/auth"
import LoginPage from "./LoginPage"
import { AlertProvider } from "../contexts/AlertContext"
import AlertContainer from "./AlertContainer"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated()

  if (!isAuthenticated) {
    return (
      <AlertProvider>
        <LoginPage />
        <AlertContainer />
      </AlertProvider>
    )
  }

  return <>{children}</>
}
