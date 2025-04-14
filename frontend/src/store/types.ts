import { Store } from 'vuex'

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

export interface RootState {
  auth: AuthState;
}

export type TypedStore = Store<RootState>