#!/usr/bin/env node

/**
 * Script para analizar estilos hardcoded en el proyecto
 * Encuentra colores, spacing y otros valores que deberían usar tokens
 */

const fs = require('fs');
const path = require('path');

// Patrones a buscar
const PATTERNS = {
  hardcodedColors: {
    pattern: /className="[^"]*(?:bg-(?:black|white|gray-\d+|indigo-\d+|red-\d+|blue-\d+|green-\d+)|text-(?:black|white|gray-\d+)|border-(?:gray-\d+|black|white))[^"]*"/g,
    description: 'Colores hardcoded (bg-black, text-gray-600, etc.)',
    suggestion: 'Usar tokens semánticos (bg-foreground, text-muted-foreground, etc.)'
  },
  arbitraryValues: {
    pattern: /className="[^"]*\[[^\]]+\][^"]*"/g,
    description: 'Valores arbitrarios ([#8B5CF6], [347px], etc.)',
    suggestion: 'Usar valores de la escala de Tailwind o tokens CSS'
  },
  repeatedPatterns: {
    pattern: /className="[^"]*(?:flex items-center|rounded-lg border|p-6 bg-white)[^"]*"/g,
    description: 'Patrones repetidos que deberían ser utilidades',
    suggestion: 'Crear utilidad CSS o componente reutilizable'
  }
};

// Directorios a analizar
const DIRS_TO_SCAN = ['components', 'app'];

// Extensiones de archivo a analizar
const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Resultados
const results = {
  totalFiles: 0,
  filesWithIssues: 0,
  issuesByType: {},
  issuesByFile: {}
};

/**
 * Escanea un directorio recursivamente
 */
function scanDirectory(dir, baseDir = '') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules y .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath, baseDir);
      }
    } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
      analyzeFile(filePath, baseDir);
    }
  });
}

/**
 * Analiza un archivo en busca de patrones
 */
function analyzeFile(filePath, baseDir) {
  results.totalFiles++;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  let fileHasIssues = false;
  const fileIssues = [];

  Object.entries(PATTERNS).forEach(([type, config]) => {
    const matches = content.match(config.pattern);
    
    if (matches && matches.length > 0) {
      fileHasIssues = true;
      
      if (!results.issuesByType[type]) {
        results.issuesByType[type] = {
          count: 0,
          files: new Set(),
          description: config.description,
          suggestion: config.suggestion
        };
      }
      
      results.issuesByType[type].count += matches.length;
      results.issuesByType[type].files.add(relativePath);
      
      fileIssues.push({
        type,
        count: matches.length,
        examples: matches.slice(0, 3) // Solo primeros 3 ejemplos
      });
    }
  });

  if (fileHasIssues) {
    results.filesWithIssues++;
    results.issuesByFile[relativePath] = fileIssues;
  }
}

/**
 * Genera reporte
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANÁLISIS DE ESTILOS HARDCODED');
  console.log('='.repeat(80) + '\n');

  console.log(`📁 Archivos analizados: ${results.totalFiles}`);
  console.log(`⚠️  Archivos con issues: ${results.filesWithIssues}`);
  console.log(`✅ Archivos limpios: ${results.totalFiles - results.filesWithIssues}\n`);

  console.log('─'.repeat(80));
  console.log('🔍 ISSUES POR TIPO\n');

  Object.entries(results.issuesByType).forEach(([type, data]) => {
    console.log(`\n📌 ${data.description}`);
    console.log(`   Ocurrencias: ${data.count}`);
    console.log(`   Archivos afectados: ${data.files.size}`);
    console.log(`   💡 Sugerencia: ${data.suggestion}`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log('📋 TOP 10 ARCHIVOS CON MÁS ISSUES\n');

  const sortedFiles = Object.entries(results.issuesByFile)
    .map(([file, issues]) => ({
      file,
      totalIssues: issues.reduce((sum, issue) => sum + issue.count, 0),
      issues
    }))
    .sort((a, b) => b.totalIssues - a.totalIssues)
    .slice(0, 10);

  sortedFiles.forEach(({ file, totalIssues, issues }, index) => {
    console.log(`\n${index + 1}. ${file} (${totalIssues} issues)`);
    issues.forEach(issue => {
      const typeInfo = results.issuesByType[issue.type];
      console.log(`   • ${typeInfo.description}: ${issue.count} ocurrencias`);
      if (issue.examples.length > 0) {
        console.log(`     Ejemplo: ${issue.examples[0].substring(0, 80)}...`);
      }
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMENDACIONES\n');
  console.log('1. Revisar STYLE_GUIDE.md para ver tokens semánticos disponibles');
  console.log('2. Priorizar archivos con más issues para refactoring');
  console.log('3. Crear componentes reutilizables para patrones repetidos');
  console.log('4. Usar tokens CSS en lugar de valores hardcoded');
  console.log('='.repeat(80) + '\n');

  // Guardar reporte en archivo
  const reportPath = path.join(process.cwd(), 'HARDCODED_STYLES_REPORT.md');
  const reportContent = generateMarkdownReport(sortedFiles);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Reporte detallado guardado en: ${reportPath}\n`);
}

/**
 * Genera reporte en formato Markdown
 */
function generateMarkdownReport(sortedFiles) {
  let md = '# 📊 Reporte de Estilos Hardcoded\n\n';
  md += `**Fecha:** ${new Date().toLocaleDateString('es-ES')}\n\n`;
  md += '---\n\n';
  
  md += '## 📈 Resumen\n\n';
  md += `- **Archivos analizados:** ${results.totalFiles}\n`;
  md += `- **Archivos con issues:** ${results.filesWithIssues}\n`;
  md += `- **Archivos limpios:** ${results.totalFiles - results.filesWithIssues}\n\n`;
  
  md += '---\n\n';
  md += '## 🔍 Issues por Tipo\n\n';
  
  Object.entries(results.issuesByType).forEach(([type, data]) => {
    md += `### ${data.description}\n\n`;
    md += `- **Ocurrencias:** ${data.count}\n`;
    md += `- **Archivos afectados:** ${data.files.size}\n`;
    md += `- **Sugerencia:** ${data.suggestion}\n\n`;
  });
  
  md += '---\n\n';
  md += '## 📋 Archivos Prioritarios para Refactoring\n\n';
  
  sortedFiles.forEach(({ file, totalIssues, issues }, index) => {
    md += `### ${index + 1}. \`${file}\` (${totalIssues} issues)\n\n`;
    issues.forEach(issue => {
      const typeInfo = results.issuesByType[issue.type];
      md += `- **${typeInfo.description}:** ${issue.count} ocurrencias\n`;
      if (issue.examples.length > 0) {
        md += `  \`\`\`tsx\n  ${issue.examples[0]}\n  \`\`\`\n`;
      }
    });
    md += '\n';
  });
  
  md += '---\n\n';
  md += '## 💡 Próximos Pasos\n\n';
  md += '1. ✅ Revisar `STYLE_GUIDE.md` para tokens disponibles\n';
  md += '2. 🔄 Refactorizar archivos prioritarios uno por uno\n';
  md += '3. 🎨 Crear componentes reutilizables para patrones comunes\n';
  md += '4. 📝 Actualizar documentación con ejemplos\n';
  
  return md;
}

// Ejecutar análisis
console.log('🔍 Analizando proyecto...\n');

DIRS_TO_SCAN.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`📂 Escaneando ${dir}/...`);
    scanDirectory(dirPath, dir);
  }
});

generateReport();
