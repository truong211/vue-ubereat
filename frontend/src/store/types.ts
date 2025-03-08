import { Store } from 'vuex'

export interface RootState {
  auth: {
    tokens: {
      accessToken: string | null;
      refreshToken: string | null;
    };
    user: any; // Replace with proper user type
  };
}

export type TypedStore = Store<RootState>