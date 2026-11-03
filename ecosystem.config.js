// Config de PM2 para correr el servidor en un VPS.
// Uso:  pm2 start ecosystem.config.js
// Cambia PIN, PORT y HOST aquí abajo (o expórtalos como variables de entorno antes de arrancar).
module.exports = {
  apps: [
    {
      name: 'draft-verdansk',
      script: 'server.js',
      cwd: __dirname,
      env: {
        PORT: process.env.PORT || 8787,
        HOST: process.env.HOST || '0.0.0.0',
        PIN: process.env.PIN || '1234',
      },
    },
  ],
};
