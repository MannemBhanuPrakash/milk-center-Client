import React from 'react'
import { AlertTriangle, UserCheck } from 'lucide-react'
import type { User } from '../types'

interface UserStatusIndicatorProps {
  user: User
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  user,
  showText = false,
  size = 'sm'
}) => {
  if (user.isActive === false) {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
    const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
    const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'md' ? 'px-2 py-1' : 'px-3 py-1'

    return (
      <div className={`inline-flex items-center gap-1 ${padding} bg-red-100 text-red-800 rounded-full ${textSize}`}>
        <AlertTriangle className={iconSize} />
        {showText && <span>Deactivated</span>}
      </div>
    )
  }

  if (showText) {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
    const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
    const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'md' ? 'px-2 py-1' : 'px-3 py-1'

    return (
      <div className={`inline-flex items-center gap-1 ${padding} bg-green-100 text-green-800 rounded-full ${textSize}`}>
        <UserCheck className={iconSize} />
        <span>Active</span>
      </div>
    )
  }

  return null
}

export default UserStatusIndicator