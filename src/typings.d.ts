declare module '*.glsl' {
  const value: string
  export default value
}

declare module 'webxr-polyfill' {
  interface Config {
    global?: any
    webvr?: boolean
    cardboard?: boolean
    cardboardConfig?: any
    allowCardboardOnDesktop?: boolean
  }
  class WebXRPolyfill {
    constructor (config?: Config)
  }
  export default WebXRPolyfill
}