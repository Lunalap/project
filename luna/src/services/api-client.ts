import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Node 서버 주소 (환경 변수 권장)
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 필요한 경우 헤더에 인증 토큰 주입
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 전역 에러 처리 (예: 401 권한 없음)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그아웃 처리 또는 리다이렉트 로직
    }
    return Promise.reject(error);
  }
);

export default apiClient;