declare module 'vuex' {
  export interface Store<S> {
    state: S
    commit: (type: string, payload?: any) => void
    dispatch: (type: string, payload?: any) => Promise<any>
    getters: any
  }

  export function createStore<S>(options: {
    state?: S
    mutations?: Record<string, (state: S, payload?: any) => void>
    actions?: Record<string, (context: {
      state: S
      commit: (type: string, payload?: any) => void
      dispatch: (type: string, payload?: any) => Promise<any>
      getters: any
    }, payload?: any) => any>
    getters?: Record<string, (state: S, getters: any) => any>
    modules?: Record<string, any>
  }): Store<S>
}