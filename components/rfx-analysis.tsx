"use client"

import { Bar, Doughnut } from "react-chartjs-2"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import type { RfxData } from "@/types/rfx-types"
import { Badge } from "@/components/ui/badge"

// Registramos los componentes necesarios para Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface RfxAnalysisProps {
  data: RfxData
}

export default function RfxAnalysis({ data }: RfxAnalysisProps) {
  // Preparar datos para el gráfico de requisitos
  const requirementsChartData = {
    labels: data.requirements.map((req) => `Req ${req.id}`),
    datasets: [
      {
        label: "Importancia",
        data: data.requirements.map((req) => req.importance * 100),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  }

  // Preparar datos para el gráfico de factores competitivos
  const competitiveFactorsChartData = {
    labels: data.competitiveFactors.map((factor) => factor.factor),
    datasets: [
      {
        data: data.competitiveFactors.map((factor) => factor.weight * 100),
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(99, 102, 241, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(79, 70, 229, 0.7)",
        ],
        borderColor: ["rgb(59, 130, 246)", "rgb(99, 102, 241)", "rgb(139, 92, 246)", "rgb(79, 70, 229)"],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Técnico":
        return "bg-blue-100 text-blue-800"
      case "Servicio":
        return "bg-green-100 text-green-800"
      case "Plazo":
        return "bg-amber-100 text-amber-800"
      case "Financiero":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Información General</CardTitle>
            <CardDescription>Detalles del RFx</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Título</dt>
                <dd>{data.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Solicitante</dt>
                <dd>{data.client}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha límite</dt>
                <dd className="font-semibold text-red-600">{data.deadline}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Factores Competitivos</CardTitle>
            <CardDescription>Ponderación de factores de evaluación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={competitiveFactorsChartData} options={options} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Resumen Ejecutivo</CardTitle>
            <CardDescription>Análisis general del RFx</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{data.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Requisitos Clave</CardTitle>
            <CardDescription>Análisis de importancia de requisitos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={requirementsChartData}
                options={{
                  ...options,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: "Importancia (%)",
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Lista de Requisitos</CardTitle>
            <CardDescription>Detalle de requisitos identificados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Requisito</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Imp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.requirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.id}</TableCell>
                      <TableCell>{req.text}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(req.category)}>
                          {req.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{(req.importance * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Fechas Importantes</CardTitle>
          <CardDescription>Cronograma del proceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <ul className="space-y-6 relative">
              {data.keyDates.map((item, index) => (
                <li key={index} className="ml-8">
                  <div className="absolute -left-3 mt-1.5">
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <p className="font-medium">{item.event}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
