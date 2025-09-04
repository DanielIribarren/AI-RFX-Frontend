#!/usr/bin/env node

/**
 * Script para verificar el estado de deploys en Vercel
 * 
 * Uso:
 * - node scripts/check-deploy-status.js
 * - VERCEL_TOKEN=... node scripts/check-deploy-status.js [project-name]
 */

const https = require('https');

const vercelToken = process.env.VERCEL_TOKEN;
const projectName = process.argv[2] || process.env.VERCEL_PROJECT_NAME || 'my-v0-project';

if (!vercelToken) {
  console.error('❌ Error: Se requiere VERCEL_TOKEN');
  console.error('');
  console.error('Para obtener tu token:');
  console.error('  1. Ve a https://vercel.com/account/tokens');
  console.error('  2. Crea un nuevo token');
  console.error('  3. Exporta: export VERCEL_TOKEN=tu_token');
  console.error('');
  console.error('Uso:');
  console.error('  VERCEL_TOKEN=xxx node scripts/check-deploy-status.js [project-name]');
  process.exit(1);
}

const checkDeployments = async (projectName, token) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Verificando deploys para proyecto: ${projectName}`);
    console.log('==========================================');
    
    const options = {
      hostname: 'api.vercel.com',
      path: `/v6/deployments?projectName=${encodeURIComponent(projectName)}&limit=5`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            
            if (response.deployments && response.deployments.length > 0) {
              console.log(`📋 Últimos ${response.deployments.length} deploys:\n`);
              
              response.deployments.forEach((deployment, index) => {
                const status = getStatusEmoji(deployment.state);
                const date = new Date(deployment.createdAt).toLocaleString();
                const duration = deployment.ready 
                  ? `${Math.round((deployment.ready - deployment.createdAt) / 1000)}s` 
                  : 'N/A';
                
                console.log(`${index + 1}. ${status} ${deployment.state.toUpperCase()}`);
                console.log(`   🔗 URL: ${deployment.url}`);
                console.log(`   📅 Fecha: ${date}`);
                console.log(`   ⏱️  Duración: ${duration}`);
                console.log(`   🏷️  Commit: ${deployment.meta?.githubCommitRef || 'N/A'}`);
                console.log('');
              });
              
              const latestDeployment = response.deployments[0];
              if (latestDeployment.state === 'READY') {
                console.log('✅ El último deploy está LISTO!');
                console.log(`🌐 Disponible en: https://${latestDeployment.url}`);
              } else if (latestDeployment.state === 'ERROR') {
                console.log('❌ El último deploy FALLÓ');
              } else {
                console.log(`🔄 Deploy en progreso: ${latestDeployment.state}`);
              }
              
            } else {
              console.log('📭 No se encontraron deploys para este proyecto');
            }
            
            resolve(response);
          } catch (error) {
            console.error('❌ Error parseando respuesta:', error.message);
            reject(error);
          }
        } else {
          console.error(`❌ Error API: HTTP ${res.statusCode}`);
          console.error('📊 Respuesta:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      reject(error);
    });

    req.end();
  });
};

const getStatusEmoji = (state) => {
  switch (state) {
    case 'READY': return '✅';
    case 'ERROR': return '❌';
    case 'BUILDING': return '🏗️';
    case 'QUEUED': return '⏳';
    case 'INITIALIZING': return '🚀';
    case 'CANCELED': return '⭕';
    default: return '🔄';
  }
};

// Ejecutar el script
(async () => {
  try {
    await checkDeployments(projectName, vercelToken);
    process.exit(0);
  } catch (error) {
    console.error('💥 Error verificando deploys:', error.message);
    process.exit(1);
  }
})();
