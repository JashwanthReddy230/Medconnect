import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Proxy API calls to the Spring Boot backend to avoid CORS issues in dev
    // HTML requests (page refreshes) are bypassed to index.html so React Router works
    proxy: {
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/hospital': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/doctor': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/patients': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/appointments': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/prescription': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/medical-record': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/notifications': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/reviews': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/blog': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/payments': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/billing': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
      '/invoice': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
  },
})