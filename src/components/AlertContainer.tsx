import React from 'react'
import { createPortal } from 'react-dom'
import { useAlert } from '../contexts/AlertContext'
import AlertComponent from './Alert'

const AlertContainer: React.FC = () => {
  const { alerts } = useAlert()

  if (alerts.length === 0) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map(alert => (
        <AlertComponent key={alert.id} alert={alert} />
      ))}
    </div>,
    document.body
  )
}

export default AlertContainer