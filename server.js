/**
 * server.js — Servidor Express para o frontend SGI no Heroku
 *
 * O Heroku não tem Nginx disponível diretamente em dynos simples.
 * Este servidor Express serve os arquivos estáticos buildados pelo Angular
 * e faz o fallback para index.html para todas as rotas (client-side routing).
 *
 * A porta é injetada pelo Heroku via variável de ambiente PORT.
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 4200;

// Pasta com os arquivos buildados pelo Angular
const DIST_FOLDER = path.join(__dirname, 'dist/sgi-frontend/browser');

// Servir arquivos estáticos com cache de 1 ano para assets com hash
app.use(express.static(DIST_FOLDER, {
  maxAge: '1y',
  // Não cacheia index.html — sempre busca a versão mais recente
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Health check — Heroku usa para verificar se o dyno está saudável
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// SPA fallback — todas as rotas não encontradas retornam o index.html
// para que o Angular Router gerencie a navegação no cliente
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_FOLDER, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SGI Frontend rodando na porta ${PORT}`);
});
