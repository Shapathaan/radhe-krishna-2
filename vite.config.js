import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Heavy 3D stack is isolated in its own chunk and only fetched when the
// master-plan section approaches the viewport (see MasterPlan.jsx).
export default defineConfig({
  // GitHub Pages project-site path
  base: '/radhe-krishna-2/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
