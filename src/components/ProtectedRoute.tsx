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
}

const ProtectedRoute = ({ children, requireAdmin = true }: ProtectedRouteProps) => {
    // Hooks
    const router = useRouter()
    const { isAuthenticated, isLoading, isAdmin } = useAuth()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login')
                return
            }

            if (requireAdmin && !isAdmin()) {
                router.push('/login')
                return
            }
        }
    }, [isAuthenticated, isLoading, isAdmin, requireAdmin, router])

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

    // Show loading if not authenticated or not admin (will redirect)
    if (!isAuthenticated || (requireAdmin && !isAdmin())) {
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
