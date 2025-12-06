'use client'

// React Imports
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Hook Imports
import useAuth from '@core/hooks/useAuth'

// Type Imports
import type { ChildrenType } from '@core/types'

interface ProtectedRouteProps extends ChildrenType {
    requireAdmin?: boolean
    allowTeacher?: boolean
}

const ProtectedRoute = ({ children, requireAdmin = true, allowTeacher = false }: ProtectedRouteProps) => {
    // Hooks
    const router = useRouter()
    const { isAuthenticated, isLoading, isAdmin, isTeacher } = useAuth()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login')
                return
            }

            // If requireAdmin is true, only allow admin
            if (requireAdmin && !isAdmin()) {
                router.push('/login')
                return
            }

            // If allowTeacher is true, allow both admin and teacher
            // But if requireAdmin is also true, it takes precedence
            if (allowTeacher && !requireAdmin) {
                if (!isAdmin() && !isTeacher()) {
                    router.push('/login')
                    return
                }
            }
        }
    }, [isAuthenticated, isLoading, isAdmin, isTeacher, requireAdmin, allowTeacher, router])

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Checking authentication...
                </Typography>
            </Box>
        )
    }

    // Show loading if not authenticated or doesn't have required permissions (will redirect)
    const hasAccess = isAuthenticated && (
        (requireAdmin && isAdmin()) ||
        (allowTeacher && !requireAdmin && (isAdmin() || isTeacher()))
    )

    if (!hasAccess) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Redirecting...
                </Typography>
            </Box>
        )
    }

    return <>{children}</>
}

export default ProtectedRoute
