declare module 'vuex' {
  import { ComponentCustomProperties } from 'vue'
  import { Store } from 'vuex'

  interface State {
    // Define your root state type
    [key: string]: any
  }

  interface Module<S, R> {
    namespaced?: boolean
    state?: S | (() => S)
    getters?: {
      [key: string]: (state: S, getters: any, rootState: R, rootGetters: any) => any
    }
    mutations?: {
      [key: string]: (state: S, payload?: any) => void
    }
    actions?: {
      [key: string]: (context: {
        commit: (type: string, payload?: any) => void
        dispatch: (type: string, payload?: any) => Promise<any>
        state: S
        getters: any
        rootState: R
        rootGetters: any
      }, payload?: any) => any
    }
    modules?: {
      [key: string]: Module<any, any>
    }
  }

  declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
      $store: Store<State>
    }
  }
}