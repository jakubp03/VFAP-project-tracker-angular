export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface User {
  email: string | null;
  name: string | null;
  uid: string | null;
}
