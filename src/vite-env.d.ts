/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DROPBOX_APP_KEY: string
  readonly VITE_DROPBOX_REDIRECT_URI: string
  readonly VITE_DROPBOX_ROOT_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
