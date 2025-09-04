#!/usr/bin/env node

/**
 * Script para disparar deploy hooks de Vercel
 * 
 * Uso:
 * - npm run hook:trigger
 * - node scripts/trigger-deploy-hook.js [hook-url]
 * - DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/... node scripts/trigger-deploy-hook.js
 */

const https = require('https');
const { URL } = require('url');

// Obtener la URL del hook desde argumentos o variables de entorno
const hookUrl = process.argv[2] || process.env.DEPLOY_HOOK_URL;

if (!hookUrl) {
  console.error('❌ Error: No se ha proporcionado URL del deploy hook');
  console.error('');
  console.error('Uso:');
  console.error('  npm run hook:trigger');
  console.error('  node scripts/trigger-deploy-hook.js <hook-url>');
  console.error('  DEPLOY_HOOK_URL=<url> npm run hook:trigger');
  console.error('');
  console.error('Para obtener tu deploy hook URL:');
  console.error('  1. Ve a tu proyecto en Vercel Dashboard');
  console.error('  2. Settings → Git → Deploy Hooks');
  console.error('  3. Create Hook y copia la URL');
  process.exit(1);
}

const triggerDeploy = async (url) => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Disparando deploy hook...');
    console.log(`📡 URL: ${url.replace(/\/[^/]*$/, '/***')}`); // Ocultar el token
    
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-RFX-Deploy-Hook/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Deploy hook disparado exitosamente!');
          
          try {
            const response = JSON.parse(data);
            if (response.job) {
              console.log(`📋 Job ID: ${response.job.id}`);
              console.log(`🔗 Estado: ${response.job.state}`);
              console.log(`📅 Creado: ${response.job.createdAt}`);
            }
          } catch (e) {
            console.log('📊 Respuesta:', data);
          }
          
          console.log('');
          console.log('🌐 Ve el progreso en: https://vercel.com/dashboard');
          resolve(response);
        } else {
          console.error(`❌ Error: HTTP ${res.statusCode}`);
          console.error('📊 Respuesta:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      reject(error);
    });

    // Enviar el payload (opcional, Vercel no lo requiere pero es buena práctica)
    const payload = JSON.stringify({
      ref: process.env.GITHUB_REF || 'main',
      repository: process.env.GITHUB_REPOSITORY || 'AI-RFX-Frontend',
      timestamp: new Date().toISOString(),
      trigger: 'manual-deploy-hook'
    });

    req.write(payload);
    req.end();
  });
};

// Ejecutar el script
(async () => {
  try {
    await triggerDeploy(hookUrl);
    process.exit(0);
  } catch (error) {
    console.error('💥 Falló el deploy hook:', error.message);
    process.exit(1);
  }
})();
