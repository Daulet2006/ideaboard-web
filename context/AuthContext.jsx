'use client'

import { createContext, useCallback, useContext, useEffect, useReducer } from 'react'
import { authService } from '../services/auth.service'
import { setToken, getToken, clearToken } from '../services/api'
import { getApiErrorMessage } from '../lib/api-error'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

function normalizeUser(user) {
  if (!user) return null
  return {
    ...user,
    _id: user._id || user.id || null,
  }
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER': {
      const normalizedUser = normalizeUser(action.payload)
      return {
        ...state,
        user: normalizedUser,
        isAuthenticated: !!normalizedUser,
        isLoading: false,
        error: null,
      }
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'LOGOUT':
      return { ...initialState, isLoading: false }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const fetchMe = useCallback(async () => {
    const token = getToken()
    if (!token) {
      dispatch({ type: 'SET_USER', payload: null })
      return
    }
    try {
      const user = await authService.getMe()
      dispatch({ type: 'SET_USER', payload: user })
    } catch {
      clearToken()
      dispatch({ type: 'SET_USER', payload: null })
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const role = state.user?.role || 'guest'
    document.documentElement.setAttribute('data-role', role)
  }, [state.user])

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const data = await authService.login(credentials)
      setToken(data.token)
      dispatch({ type: 'SET_USER', payload: data.user })
      return data
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: getApiErrorMessage(err, 'Login failed.') })
      throw err
    }
  }, [])

  const register = useCallback(async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const data = await authService.register(credentials)
      setToken(data.token)
      dispatch({ type: 'SET_USER', payload: data.user })
      return data
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: getApiErrorMessage(err, 'Registration failed.') })
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updateUser = useCallback((user) => {
    dispatch({ type: 'SET_USER', payload: user })
  }, [])

  const value = {
    ...state,
    login,
    register,
    logout,
    fetchMe,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

export default AuthContext
