import type { Configuration, PopupRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: 'COLOQUE_SEU_CLIENT_ID_AQUI',
    authority: 'https://login.microsoftonline.com/COLOQUE_SEU_TENANT_ID_AQUI',
    redirectUri: typeof window === 'undefined' ? '/' : window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
}

export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
}
