import axios from "axios";
import store from "../redux/Store";
import { setLoading, showToast } from "../redux/slices/appConfigSlice";
import { TOAST_FAILURE } from "../App";
import {
  getItem,
  KEY_ACCESS_TOKEN,
  removeItem,
  setItem,
} from "./localStorageManager";

let baseURL = "https://joysie-backend.onrender.com";

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

axiosClient.interceptors.request.use((request) => {
  const accessToken = getItem(KEY_ACCESS_TOKEN);
  if (accessToken) {
    // Check if the access token exists before adding the Authorization header
    request.headers["Authorization"] = `Bearer ${accessToken}`;
    store.dispatch(setLoading(true));
  }
  return request;
});

axiosClient.interceptors.response.use(
  async (response) => {
    store.dispatch(setLoading(false));
    const data = response.data;
    if (data.status === "ok") {
      return data;
    }

    const originalRequest = response.config;
    const statusCode = data.statusCode;
    const error = data.message;

    store.dispatch(
      showToast({
        type: TOAST_FAILURE,
        message: error,
      })
    );

    if (statusCode === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axiosClient.get("/auth/refresh");
        if (refreshResponse.status === "ok") {
          setItem(KEY_ACCESS_TOKEN, refreshResponse.result.accessToken);
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${refreshResponse.data.result.accessToken}`;
          return axiosClient(originalRequest);
        } else {
          removeItem(KEY_ACCESS_TOKEN);
          window.location.replace("/login"); // Redirect to login page
          return Promise.reject(error);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
  async (error) => {
    store.dispatch(setLoading(false));
    store.dispatch(
      showToast({
        type: TOAST_FAILURE,
        message: error.message,
      })
    );
  }
);

export default axiosClient; // You might want to export the axiosClient for use in other parts of your application
