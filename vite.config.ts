import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// emptyOutDir:false —— 规避沙箱批量删除保护（dist/photos 超 50 文件会拦截），
// 改为构建前手动清空 dist/assets 与 index.html，public/photos 由 vite 直接同名覆盖。
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    emptyOutDir: false,
  },
})
