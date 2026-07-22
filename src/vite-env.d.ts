/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOURCE_REPO_URL?: string;
  readonly VITE_SOURCE_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
