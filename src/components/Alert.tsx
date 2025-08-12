import React, { useEffect, useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { Alert as AlertType, useAlert } from '../contexts/AlertContext'

interface AlertComponentProps {
  alert: AlertType
}

const AlertComponent: React.FC<AlertComponentProps> = ({ alert }) => {
  const { removeAlert } = useAlert()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => removeAlert(alert.id), 300)
  }

  const getAlertStyles = () => {
    const baseStyles = "relative p-4 rounded-xl shadow-lg border border-l-4 transition-all duration-300 transform"

    switch (alert.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`
      case 'loading':
        return `${baseStyles} bg-indigo-50 border-indigo-400 text-indigo-800`
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`
    }
  }

  const getIcon = () => {
    const iconClass = "w-5 h-5 mr-3 flex-shrink-0"

    switch (alert.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />
      case 'error':
        return <XCircle className={`${iconClass} text-red-600`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />
      case 'loading':
        return <Loader2 className={`${iconClass} text-indigo-600 animate-spin`} />
      default:
        return <Info className={`${iconClass} text-gray-600`} />
    }
  }

  const handleActionClick = (action: any) => {
    action.onClick()
    removeAlert(alert.id)
  }

  const getActionButtonStyles = (style: string) => {
    const baseStyles = "px-3 py-1 text-xs font-medium rounded transition-colors"

    switch (style) {
      case 'primary':
        return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700`
      case 'danger':
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700`
      case 'secondary':
      default:
        return `${baseStyles} bg-gray-200 text-gray-800 hover:bg-gray-300`
    }
  }

  const animationClasses = isLeaving
    ? 'opacity-0 translate-x-full'
    : isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-full'

  return (
    <div className={`${getAlertStyles()} ${animationClasses} mb-3 max-w-md w-full`}>
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {alert.title && (
            <h4 className="text-sm font-semibold mb-1">{alert.title}</h4>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">{alert.message}</p>

          {/* Action buttons */}
          {alert.actions && alert.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {alert.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className={getActionButtonStyles(action.style || 'secondary')}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button - only show if dismissible */}
        {alert.dismissible !== false && (
          <button
            onClick={handleClose}
            className="ml-3 flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertComponent