// src/environments/environment.heroku.ts
// Usado no build de produção para o Heroku (ng build --configuration heroku)
export const environment = {
  production: true,

  // A URL do backend Heroku — substitua pelo nome real da sua app
  // Ex: https://sgi-backend-abc123.herokuapp.com
  apiUrl: 'https://sgi-backend-labs-4616bf65e74e.herokuapp.com/api',

  entraId: {
    enabled: false,   // Altere para true se quiser Entra ID no Heroku
    clientId:    '',
    tenantId:    '',
    redirectUri: 'https://SEU-APP-FRONTEND.herokuapp.com',
    scopes: ['api://<APP_ID>/SGI.Read', 'api://<APP_ID>/SGI.Write'],
  },
};
