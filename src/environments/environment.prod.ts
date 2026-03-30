// src/environments/environment.prod.ts  (PRODUÇÃO / ARO)
export const environment = {
  production: true,
  apiUrl: '/api', // nginx faz proxy reverso para o backend

  entraId: {
    enabled: true,
    clientId:    '${AZURE_CLIENT_ID}',      // substituído na build ou via ConfigMap
    tenantId:    '${AZURE_TENANT_ID}',
    redirectUri: 'https://sgi.apps.<cluster-domain>',
    scopes: ['api://<APP_ID>/SGI.Read', 'api://<APP_ID>/SGI.Write'],
  },
};
