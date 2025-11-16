'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Hook Imports
import { useObjectCookie } from './useObjectCookie'
import { apiClient } from './apiClient'
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
    permissions: string[]
}

const ROLE_COLUMNS = [
    { column: 'Quản lý lịch học', key: 'schedule' },
    { column: 'Kế toán', key: 'accounting' },
    { column: 'Quản lý lớp học', key: 'class' },
    { column: 'Quản lý giáo viên', key: 'teacher' },
    { column: 'Quản lý người dùng', key: 'user' }
]

const ADMIN_PREFIX = 'admin'
const ALL_PERMISSION_KEYS = ROLE_COLUMNS.map(({ key }) => key)

const derivePermissionsFromRole = (role: string | null): string[] => {
    if (!role) return []

    if (role === ADMIN_PREFIX) {
        return ALL_PERMISSION_KEYS
    }

    if (role.startsWith(`${ADMIN_PREFIX}_`)) {
        const keys = role
            .slice(ADMIN_PREFIX.length + 1)
            .split('_')
            .filter(Boolean)

        // Ensure only known permission keys are included
        return ALL_PERMISSION_KEYS.filter(key => keys.includes(key))
    }

    return []
}

const useAuth = () => {
    // States
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: true,
        permissions: []
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
                    isLoading: false,
                    permissions: derivePermissionsFromRole(localRole)
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
                isLoading: false,
                permissions: derivePermissionsFromRole(roleCookie)
            })
        } else {
            setAuthState(prev => ({ ...prev, isLoading: false, permissions: [] }))
        }
    }, [tokenCookie, roleCookie])

    // Login function
    const login = useCallback(async (credentials: LoginRequest): Promise<{ success: boolean; message: string }> => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }))

            // API call to login endpoint
            const { data } = await apiClient.post('/login', credentials);

            if (data.error || !data.data) {
                return { success: false, message: data.error || 'Login failed' }
            }

            const userRole = data.data.role

            // Only allow admin roles
            if (!userRole || !userRole.startsWith(ADMIN_PREFIX)) {
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
                role: userRole,
                isAuthenticated: true,
                isLoading: false,
                permissions: derivePermissionsFromRole(userRole)
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
            isLoading: false,
            permissions: []
        })
        router.push('/login')
    }, [setTokenCookie, setRoleCookie, router])

    // Get authorization header
    const getAuthHeader = useCallback(() => {
        return authState.token ? `Bearer ${authState.token}` : null
    }, [authState.token])

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return authState.role?.startsWith(ADMIN_PREFIX) ?? false
    }, [authState.role])

    const hasPermission = useCallback(
        (permissionKey: string) => {
            if (!authState.isAuthenticated) return false
            if (authState.role === ADMIN_PREFIX) return true

            return authState.permissions.includes(permissionKey)
        },
        [authState.isAuthenticated, authState.permissions, authState.role]
    )

    return {
        ...authState,
        login,
        logout,
        getAuthHeader,
        isAdmin,
        hasPermission
    }
}

export default useAuth
