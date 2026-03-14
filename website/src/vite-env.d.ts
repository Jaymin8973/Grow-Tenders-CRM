/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_CONTACT_SALES_EMAIL?: string;
  readonly VITE_CONTACT_PHONE?: string;
  readonly VITE_CONTACT_PHONE_ALT?: string;
  readonly VITE_CONTACT_PHONE_TEL?: string;
  readonly VITE_CONTACT_ADDRESS?: string;
  readonly VITE_WHATSAPP_LINK?: string;
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_COMPANY_CIN?: string;
  readonly VITE_GEM_PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
