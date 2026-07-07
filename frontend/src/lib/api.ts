import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (token) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

// Request Interceptor: Attach access token
api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error status is 403 (expired access token) and we haven't retried yet
        if (error.response?.status === 403 && !originalRequest._retry) {
            if (isRefreshing) {
                // If token refresh is already in progress, wait for it to resolve
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        },
                        reject: (err: any) => {
                            reject(err);
                        },
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint using global axios
                const response = await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = response.data.accessToken;
                setAccessToken(newAccessToken);

                // Update the Authorization header for the original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Process the queued requests
                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                // If refresh fails, clear token and redirect to login
                setAccessToken(null);
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login?session_expired=true";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
