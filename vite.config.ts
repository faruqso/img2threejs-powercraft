import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    // A relative default works at localhost, a custom domain, and any GitHub
    // Pages project path. Override it when a host requires an absolute base.
    base: env.VITE_BASE_PATH || './',
  };
});
