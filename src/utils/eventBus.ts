// Simple event bus for cross-component communication
class EventBus {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {}

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(...args))
  }
}

export const eventBus = new EventBus()

// Event types
export const EVENTS = {
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  COLLECTION_UPDATED: 'collection_updated',
  DATA_REFRESH_NEEDED: 'data_refresh_needed',
  USER_ACCESS_DENIED: 'user_access_denied',
  USER_DEACTIVATED: 'user_deactivated',
  USER_REACTIVATED: 'user_reactivated'
} as const