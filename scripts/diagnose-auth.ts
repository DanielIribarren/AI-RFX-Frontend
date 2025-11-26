/**
 * Script de diagnóstico de autenticación
 * Ejecutar en consola del navegador para diagnosticar problemas de auth
 */

async function diagnoseAuth() {
  console.log('🔍 ========================================')
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN')
  console.log('🔍 ========================================\n')

  const results: any[] = []

  // Test 1: LocalStorage
  console.log('📋 Test 1: Verificando tokens en localStorage...')
  const accessToken = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  
  if (accessToken) {
    console.log('✅ Access token encontrado:', accessToken.substring(0, 30) + '...')
    results.push({ test: 'LocalStorage - Access Token', status: 'OK' })
  } else {
    console.log('❌ Access token NO encontrado')
    results.push({ test: 'LocalStorage - Access Token', status: 'FAIL' })
  }

  if (refreshToken) {
    console.log('✅ Refresh token encontrado:', refreshToken.substring(0, 30) + '...')
    results.push({ test: 'LocalStorage - Refresh Token', status: 'OK' })
  } else {
    console.log('❌ Refresh token NO encontrado')
    results.push({ test: 'LocalStorage - Refresh Token', status: 'FAIL' })
  }

  // Test 2: Cookies
  console.log('\n📋 Test 2: Verificando cookies...')
  const cookies = document.cookie
  const hasAccessCookie = cookies.includes('access_token=')
  const hasRefreshCookie = cookies.includes('refresh_token=')
  
  console.log('Cookies actuales:', cookies || '(vacío)')
  
  if (hasAccessCookie) {
    console.log('✅ Cookie access_token encontrada')
    results.push({ test: 'Cookies - Access Token', status: 'OK' })
  } else {
    console.log('❌ Cookie access_token NO encontrada')
    results.push({ test: 'Cookies - Access Token', status: 'FAIL' })
  }

  if (hasRefreshCookie) {
    console.log('✅ Cookie refresh_token encontrada')
    results.push({ test: 'Cookies - Refresh Token', status: 'OK' })
  } else {
    console.log('❌ Cookie refresh_token NO encontrada')
    results.push({ test: 'Cookies - Refresh Token', status: 'FAIL' })
  }

  // Test 3: Decodificar token
  console.log('\n📋 Test 3: Decodificando access token...')
  if (accessToken) {
    try {
      const parts = accessToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        console.log('✅ Token decodificado exitosamente')
        console.log('   User ID:', payload.sub || payload.user_id || 'N/A')
        console.log('   Email:', payload.email || 'N/A')
        console.log('   Issued at:', new Date(payload.iat * 1000).toLocaleString())
        console.log('   Expires at:', new Date(payload.exp * 1000).toLocaleString())
        
        const now = Date.now()
        const expiry = payload.exp * 1000
        const timeLeft = expiry - now
        
        if (timeLeft > 0) {
          console.log('✅ Token válido. Expira en:', Math.floor(timeLeft / 60000), 'minutos')
          results.push({ test: 'Token Expiration', status: 'OK', details: `${Math.floor(timeLeft / 60000)} min` })
        } else {
          console.log('❌ Token EXPIRADO hace:', Math.floor(Math.abs(timeLeft) / 60000), 'minutos')
          results.push({ test: 'Token Expiration', status: 'FAIL', details: 'Expired' })
        }
      } else {
        console.log('❌ Token con formato inválido')
        results.push({ test: 'Token Format', status: 'FAIL' })
      }
    } catch (error) {
      console.log('❌ Error decodificando token:', error)
      results.push({ test: 'Token Decode', status: 'FAIL' })
    }
  } else {
    console.log('⚠️  No hay token para decodificar')
    results.push({ test: 'Token Decode', status: 'SKIP' })
  }

  // Test 4: API Health Check
  console.log('\n📋 Test 4: Verificando conectividad con API...')
  const apiUrl = 'http://localhost:5001/api/auth'
  
  try {
    const healthResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (healthResponse.ok) {
      console.log('✅ API health check OK:', healthResponse.status)
      results.push({ test: 'API Health', status: 'OK' })
    } else {
      console.log('⚠️  API respondió pero con error:', healthResponse.status)
      results.push({ test: 'API Health', status: 'WARNING', details: healthResponse.status })
    }
  } catch (error: any) {
    console.log('❌ No se pudo conectar con la API:', error.message)
    results.push({ test: 'API Health', status: 'FAIL', details: error.message })
  }

  // Test 5: GET /me endpoint
  console.log('\n📋 Test 5: Probando endpoint /me...')
  if (accessToken) {
    try {
      const meResponse = await fetch(`${apiUrl}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (meResponse.ok) {
        const data = await meResponse.json()
        console.log('✅ Endpoint /me respondió OK')
        console.log('   Usuario:', data.user?.email || 'N/A')
        console.log('   Nombre:', data.user?.full_name || 'N/A')
        console.log('   ID:', data.user?.id || 'N/A')
        results.push({ test: 'GET /me', status: 'OK' })
      } else {
        const errorText = await meResponse.text()
        console.log('❌ Endpoint /me falló:', meResponse.status)
        console.log('   Respuesta:', errorText)
        results.push({ test: 'GET /me', status: 'FAIL', details: meResponse.status })
      }
    } catch (error: any) {
      console.log('❌ Error llamando /me:', error.message)
      results.push({ test: 'GET /me', status: 'FAIL', details: error.message })
    }
  } else {
    console.log('⚠️  No hay token para probar /me')
    results.push({ test: 'GET /me', status: 'SKIP' })
  }

  // Test 6: Refresh token endpoint
  console.log('\n📋 Test 6: Probando refresh token...')
  if (refreshToken) {
    try {
      const refreshResponse = await fetch(`${apiUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        console.log('✅ Token refresh exitoso')
        console.log('   Nuevo access token recibido:', data.access_token ? 'Sí' : 'No')
        results.push({ test: 'Token Refresh', status: 'OK' })
      } else {
        const errorText = await refreshResponse.text()
        console.log('❌ Token refresh falló:', refreshResponse.status)
        console.log('   Respuesta:', errorText)
        results.push({ test: 'Token Refresh', status: 'FAIL', details: refreshResponse.status })
      }
    } catch (error: any) {
      console.log('❌ Error en refresh:', error.message)
      results.push({ test: 'Token Refresh', status: 'FAIL', details: error.message })
    }
  } else {
    console.log('⚠️  No hay refresh token para probar')
    results.push({ test: 'Token Refresh', status: 'SKIP' })
  }

  // Resumen
  console.log('\n📊 ========================================')
  console.log('📊 RESUMEN DE DIAGNÓSTICO')
  console.log('📊 ========================================')
  
  const passed = results.filter(r => r.status === 'OK').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  
  console.log(`✅ Pasaron: ${passed}`)
  console.log(`❌ Fallaron: ${failed}`)
  console.log(`⚠️  Advertencias: ${warnings}`)
  console.log(`⏭️  Omitidos: ${skipped}`)
  
  console.log('\n📋 Resultados detallados:')
  console.table(results)

  // Diagnóstico final
  console.log('\n🔍 ========================================')
  console.log('🔍 DIAGNÓSTICO FINAL')
  console.log('🔍 ========================================')
  
  if (failed === 0 && passed > 0) {
    console.log('✅ Sistema de autenticación funcionando correctamente')
  } else if (!accessToken && !refreshToken) {
    console.log('❌ PROBLEMA: No hay tokens. Usuario debe hacer login.')
  } else if (accessToken && results.find(r => r.test === 'Token Expiration')?.status === 'FAIL') {
    console.log('❌ PROBLEMA: Token expirado. Intentar refresh o re-login.')
  } else if (results.find(r => r.test === 'API Health')?.status === 'FAIL') {
    console.log('❌ PROBLEMA: Backend no responde. Verificar que esté corriendo.')
  } else if (results.find(r => r.test === 'GET /me')?.status === 'FAIL') {
    console.log('❌ PROBLEMA: Endpoint /me falla. Verificar backend y CORS.')
  } else {
    console.log('⚠️  PROBLEMA MIXTO: Revisar resultados detallados arriba.')
  }

  return results
}

// Ejecutar automáticamente
diagnoseAuth()
