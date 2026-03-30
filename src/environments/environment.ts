// src/environments/environment.ts  (DEV)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',

  // Azure Entra ID — desabilitado em DEV
  entraId: {
    enabled: false,
    clientId: '',
    tenantId: '',
    redirectUri: 'http://localhost:4200',
    scopes: ['api://<APP_ID>/SGI.Read', 'api://<APP_ID>/SGI.Write'],
  },
};
