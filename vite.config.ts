
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process explicitly to ensure Node.js types are available in the config
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // 加载环境变量（包括 .env.local 中的 VITE_ 前缀变量）
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 保持与系统指令一致，将 API_KEY 映射到 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY)
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
