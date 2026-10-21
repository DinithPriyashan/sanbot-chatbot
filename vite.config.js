import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { env } from 'node:process'

const repositoryName = env.GITHUB_REPOSITORY?.split('/')[1]
const base = env.VITE_BASE_PATH
  || (env.GITHUB_ACTIONS === 'true' && repositoryName && !repositoryName.endsWith('.github.io')
    ? `/${repositoryName}/`
    : './')

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
  ],
})