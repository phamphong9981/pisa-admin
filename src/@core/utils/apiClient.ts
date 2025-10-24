// Utility function for making authenticated API requests
export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    token?: string
}

export const apiClient = async <T = any>(
    url: string,
    options: ApiRequestOptions = {}
): Promise<T> => {
    const {
        method = 'GET',
        headers = {},
        body,
        token
    } = options

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
    }

    // Add Bearer token if provided
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
    }

    if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body)
    }

    try {
        const response = await fetch(url, requestOptions)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('API request failed:', error)
        throw error
    }
}

// Helper function to get token from localStorage/cookies
export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null

    // Try to get from localStorage first
    const token = localStorage.getItem('auth_token')
    if (token) return token

    // Fallback to cookies
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='))
    if (authCookie) {
        return authCookie.split('=')[1]
    }

    return null
}
