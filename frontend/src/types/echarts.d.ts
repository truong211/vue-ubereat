declare module 'echarts/core'
declare module 'echarts/renderers'
declare module 'echarts/charts'
declare module 'echarts/components'

declare module 'vue-echarts' {
  import { DefineComponent } from 'vue'
  
  interface EChartsOption {
    [key: string]: any
  }

  const VueECharts: DefineComponent<{
    option: EChartsOption
    theme?: string | object
    initOptions?: object
    autoresize?: boolean
    loading?: boolean
    loadingOptions?: object
    manual?: boolean
  }>

  export default VueECharts
}

// Add ECharts as a global type
declare module 'echarts' {
  const echarts: any
  export default echarts
}