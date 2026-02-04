import { apiClient } from "./client";
import type { Token, LoginRequest, User, Language, Theme } from "@/types/api";

export const authApi = {
  login: async (data: LoginRequest): Promise<Token> => {
    return apiClient.post<Token>("/auth/login", data);
  },

  refresh: async (refreshToken: string): Promise<Token> => {
    return apiClient.post<Token>("/auth/refresh", { refresh_token: refreshToken });
  },

  getMe: async (token: string): Promise<User> => {
    return apiClient.get<User>("/users/me", token);
  },

  updateMe: async (token: string, data: { language?: Language; theme?: Theme }): Promise<User> => {
    return apiClient.patch<User>("/users/me", data, token);
  },
};
