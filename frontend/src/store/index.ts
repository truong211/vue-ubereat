import { InjectionKey } from 'vue'
import { Store, createStore, useStore as baseUseStore } from 'vuex'
import auth, { AuthState } from './auth'
import user, { UserState } from './modules/user'

export interface RootState {
  auth: AuthState;
  user: UserState;
}

// Define injection key
export const key: InjectionKey<Store<RootState>> = Symbol()

// Create store
export const store = createStore<RootState>({
  modules: {
    auth,
    user
  }
})

// Define typed useStore hook
export function useStore() {
  return baseUseStore(key) as Store<RootState>
}

export default store