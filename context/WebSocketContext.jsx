'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { wsService } from '../services/websocket.service'
import { useAuthContext } from './AuthContext'
import { getToken } from '../services/api'

const WebSocketContext = createContext(null)

export function WebSocketProvider({ children }) {
  const { isAuthenticated } = useAuthContext()
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState({ count: 0, userIds: [] })
  const listenersRef = useRef([])

  useEffect(() => {
    if (!isAuthenticated) {
      wsService.disconnect()
      setIsConnected(false)
      return
    }

    const token = getToken()
    if (!token) return

    wsService.connect(token)

    const unsubConnected = wsService.on('_connected', () => setIsConnected(true))
    const unsubDisconnected = wsService.on('_disconnected', () => setIsConnected(false))
    const unsubOnline = wsService.on('ONLINE_USERS', (payload) => {
      setOnlineUsers({ count: payload.count, userIds: payload.userIds || [] })
    })

    return () => {
      unsubConnected()
      unsubDisconnected()
      unsubOnline()
      wsService.disconnect()
      setIsConnected(false)
    }
  }, [isAuthenticated])

  const subscribe = useCallback((event, callback) => {
    const unsub = wsService.on(event, callback)
    listenersRef.current.push(unsub)
    return unsub
  }, [])

  const value = {
    isConnected,
    onlineUsers,
    subscribe,
    wsService,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocketContext must be used within WebSocketProvider')
  return ctx
}

export default WebSocketContext
