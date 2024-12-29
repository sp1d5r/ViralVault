import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [react()],
    server: {
      middleware: {
        pre: [
          (req, res, next) => {
            try {
              req.url = decodeURI(req.url).replace(/%/g, '%25')
              next()
            } catch (e) {
              next(e)
            }
          }
        ]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'shared': path.resolve(__dirname, '../shared/src')
      }
    }
  }
})