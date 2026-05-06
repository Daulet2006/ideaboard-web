import { useEffect } from 'react'
import { useWebSocketContext } from '../context/WebSocketContext'

export function useWebSocket() {
  return useWebSocketContext()
}

export function useWebSocketEvent(event, handler) {
  const { subscribe } = useWebSocketContext()

  useEffect(() => {
    if (!event || !handler) return
    const unsub = subscribe(event, handler)
    return () => unsub()
  }, [event, handler, subscribe])
}
