"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Calendar, Clock } from "lucide-react"

interface ProcessedFile {
  id: string
  name: string
  size: number
  status: 'processed' | 'processing' | 'error'
  processedAt: string
  type: string
  url?: string
}

interface ProcessedFilesContentProps {
  files?: ProcessedFile[]
  rfxId?: string
  receivedAt?: string
  isDisabled?: boolean
}

export default function ProcessedFilesContent({
  files = [],
  rfxId,
  receivedAt,
  isDisabled = false
}: ProcessedFilesContentProps) {
  
  // Mock data if no files provided - this will be replaced with real data
  const mockFiles: ProcessedFile[] = files.length > 0 ? files : [
    {
      id: "1",
      name: "documento_original.pdf",
      size: 2.3 * 1024 * 1024, // 2.3 MB
      status: "processed",
      processedAt: receivedAt || new Date().toISOString(),
      type: "application/pdf"
    }
  ]

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'processed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Procesado</Badge>
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🔄 Procesando</Badge>
      case 'error':
        return <Badge variant="destructive">❌ Error</Badge>
      default:
        return <Badge variant="outline">❓ Desconocido</Badge>
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('image')) return '🖼️'
    return '📁'
  }

  const handleViewFile = (file: ProcessedFile) => {
    // TODO: Implement file viewing logic
    console.log('View file:', file.name)
    alert(`Ver archivo: ${file.name}\n\nEsta funcionalidad se implementará próximamente.`)
  }

  const handleDownloadFile = (file: ProcessedFile) => {
    // TODO: Implement file download logic
    console.log('Download file:', file.name)
    alert(`Descargar archivo: ${file.name}\n\nEsta funcionalidad se implementará próximamente.`)
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-light" />
            Resumen de Procesamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                📁
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Archivos</p>
                <p className="text-lg font-semibold text-gray-900">{mockFiles.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                ✅
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procesados</p>
                <p className="text-lg font-semibold text-gray-900">
                  {mockFiles.filter(f => f.status === 'processed').length}
                </p>
              </div>
            </div>
            
            {receivedAt && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Recepción</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(receivedAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Archivos Procesados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockFiles.map((file) => (
              <div 
                key={file.id} 
                className={`border border rounded-lg p-4 transition-colors ${
                  isDisabled ? 'opacity-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        {getStatusBadge(file.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Procesado {new Date(file.processedAt).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewFile(file)}
                      disabled={isDisabled || file.status !== 'processed'}
                      className="gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                      disabled={isDisabled || file.status !== 'processed'}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Descargar
                    </Button>
                  </div>
                </div>
                
                {/* Processing Details */}
                {file.status === 'processed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Estado:</span>
                        <span className="ml-1 text-green-600 font-medium">Completado</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="ml-1 text-gray-700">{file.type.split('/')[1]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">RFX ID:</span>
                        <span className="ml-1 text-gray-700">{rfxId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Extracción:</span>
                        <span className="ml-1 text-primary font-medium">IA + OCR</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {mockFiles.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground/60 text-4xl mb-2">📁</div>
              <p className="text-muted-foreground">No se encontraron archivos procesados</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Los archivos aparecerán aquí una vez que sean procesados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
