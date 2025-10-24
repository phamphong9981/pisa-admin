'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Hook Imports
import { useObjectCookie } from './useObjectCookie'
import axios from 'axios'
// Type Imports
interface LoginRequest {
    username: string
    password: string
}

interface LoginResponse {
    data: {
        token: string
        role: string
    }
    error: string | null
}

interface AuthState {
    token: string | null
    role: string | null
    isAuthenticated: boolean
    isLoading: boolean
}

const useAuth = () => {
    // States
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: true
    })

    // Hooks
    const router = useRouter()
    const [tokenCookie, setTokenCookie] = useObjectCookie<string>('auth_token', null)
    const [roleCookie, setRoleCookie] = useObjectCookie<string>('user_role', null)

    // Initialize auth state from cookies and localStorage
    useEffect(() => {
        // Check localStorage first (for better persistence)
        if (typeof window !== 'undefined') {
            const localToken = localStorage.getItem('auth_token')
            const localRole = localStorage.getItem('user_role')

            if (localToken && localRole) {
                setAuthState({
                    token: localToken,
                    role: localRole,
                    isAuthenticated: true,
                    isLoading: false
                })
                return
            }
        }

        // Fallback to cookies
        if (tokenCookie && roleCookie) {
            setAuthState({
                token: tokenCookie,
                role: roleCookie,
                isAuthenticated: true,
                isLoading: false
            })
        } else {
            setAuthState(prev => ({ ...prev, isLoading: false }))
        }
    }, [tokenCookie, roleCookie])

    // Login function
    const login = useCallback(async (credentials: LoginRequest): Promise<{ success: boolean; message: string }> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }))

            // API call to login endpoint
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/login`, credentials);

            if (data.error || !data.data) {
                return { success: false, message: data.error || 'Login failed' }
            }

            // Check if user is admin
            if (data.data.role !== 'admin') {
                return { success: false, message: 'Access denied. Admin privileges required.' }
            }

            // Store token and role in cookies and localStorage
            setTokenCookie(data.data.token)
            setRoleCookie(data.data.role)

            // Also store in localStorage for better persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.data.token)
                localStorage.setItem('user_role', data.data.role)
            }

            // Update auth state
            setAuthState({
                token: data.data.token,
                role: data.data.role,
                isAuthenticated: true,
                isLoading: false
            })

            return { success: true, message: 'Login successful' }
        } catch (error) {
            setAuthState(prev => ({ ...prev, isLoading: false }))
            return { success: false, message: 'Network error. Please try again.' }
        }
    }, [setTokenCookie, setRoleCookie])

    // Logout function
    const logout = useCallback(() => {
        setTokenCookie('')
        setRoleCookie('')

        // Clear localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_role')
        }

        setAuthState({
            token: null,
            role: null,
            isAuthenticated: false,
            isLoading: false
        })
        router.push('/login')
    }, [setTokenCookie, setRoleCookie, router])

    // Get authorization header
    const getAuthHeader = useCallback(() => {
        return authState.token ? `Bearer ${authState.token}` : null
    }, [authState.token])

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return authState.role === 'admin'
    }, [authState.role])

    return {
        ...authState,
        login,
        logout,
        getAuthHeader,
        isAdmin
    }
}

export default useAuth
