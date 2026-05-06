import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config.url.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export function setupLoadingInterceptor(setLoading: (val: boolean) => void) {
  let activeRequests = 0;
 
  const reqId = api.interceptors.request.use((config) => {
    // Puedes excluir rutas que no quieres que disparen el loader global
    const silent = (config as any).silent;
    if (!silent) {
      activeRequests++;
      setLoading(true);
    }
    return config;
  });
 
  const resId = api.interceptors.response.use(
    (response) => {
      const silent = (response.config as any).silent;
      if (!silent) {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests === 0) setLoading(false);
      }
      return response;
    },
    (error) => {
      const silent = (error.config as any)?.silent;
      if (!silent) {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests === 0) setLoading(false);
      }
      return Promise.reject(error);
    },
  );
 
  // Retorna cleanup para el useEffect
  return () => {
    api.interceptors.request.eject(reqId);
    api.interceptors.response.eject(resId);
  };
}
 

export default api;
