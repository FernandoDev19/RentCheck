import type { UserActiveType } from "../shared/types/user-active.type";
import api from "../core/api/api";

export interface LoginDataInterface {
  email: string;
  password: string;
}

export interface AuthResponseInterface {
  accessToken: string;
}

export const authService = {
  async login(credentials: LoginDataInterface): Promise<void> {
    const response = await api.post("/auth/login", credentials);
    
    // El backend ahora setea la cookie automáticamente.
    // Solo actualizamos el user si viniera en la respuesta, o limpiamos la cache anterior
    if (response.data.ok) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
  },

  async logout(): Promise<boolean> {
    const response = await api.post("/auth/logout");
    if (response.data.ok) {
      localStorage.removeItem("user");
    }
    return response.data.ok;
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await api.post("/auth/verify");

      if (response.data && response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return true;
    } catch {
      localStorage.removeItem("user");
      return false;
    }
  },

  async getProfile(): Promise<UserActiveType | null> {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};
