import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: any) => void }> = [];

const processQueue = (error: any) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Request Interceptor: No longer need to manually attach Bearer header since cookies are sent automatically
api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration (Cookie Rotation)
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
                        resolve: () => {
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
                // Call refresh endpoint using global axios (which updates cookies)
                await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Process the queued requests
                processQueue(null);
                isRefreshing = false;

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                isRefreshing = false;

                // If refresh fails, redirect to login
                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login?session_expired=true";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
