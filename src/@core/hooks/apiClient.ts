import axios, { AxiosResponse } from 'axios'

// Create axios instance with default config
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: 0, // 30 seconds for alpha simulation,
    onUploadProgress: e => { console.log(e.progress) }, // hiển thị % đã upload
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add request interceptor for logging and auth
apiClient.interceptors.request.use(
    (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)

        // Add auth token if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Helper function to handle logout (clear storage and redirect)
const handleUnauthorized = () => {
    if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')

        // Clear cookies
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        // Redirect to login page
        window.location.href = '/login'
    }
}

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    (error) => {
        console.error('❌ API Error:', error.response?.data || error.message)

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            console.warn('🔒 Unauthorized - logging out and redirecting to login')
            handleUnauthorized()
        }

        return Promise.reject(error)
    }
)
