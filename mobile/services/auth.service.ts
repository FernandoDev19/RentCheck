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
  async login(credentials: LoginDataInterface): Promise<AuthResponseInterface> {
    const response = await api.post("/auth/login", credentials);
    const { accessToken } = response.data;

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.setItem("token", accessToken);

    return { accessToken };
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const response = await api.post("/auth/verify");

      if(localStorage.getItem("user") === null) {
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }

      return true;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  },

  async getProfile(): Promise<UserActiveType | null> {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};
