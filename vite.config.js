import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'nycksbiywsxm.sealosbja.site',
      '.sealosbja.site',
      'devbox1.ns-mutrnoyx.svc.cluster.local',
      '.ns-mutrnoyx.svc.cluster.local'
    ]
  }
})