import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: '/wormhole',
  plugins: [
    glsl(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0'
  }
})
