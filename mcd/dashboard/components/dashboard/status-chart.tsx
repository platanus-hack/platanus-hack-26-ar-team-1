"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
import type { DashboardStats } from "@/lib/types"

interface StatusChartProps {
  stats: DashboardStats
}

const chartConfig = {
  completed: {
    label: "Completados",
    color: "var(--chart-3)",
  },
  in_progress: {
    label: "En Progreso",
    color: "var(--chart-4)",
  },
  pending: {
    label: "Pendientes",
    color: "var(--chart-2)",
  },
  non_responsive: {
    label: "Sin Respuesta",
    color: "var(--chart-5)",
  },
}

const COLORS = ["var(--chart-3)", "var(--chart-4)", "var(--chart-2)", "var(--chart-5)"]

export function StatusChart({ stats }: StatusChartProps) {
  const data = [
    { name: "Completados", value: stats.completedPatients },
    { name: "En Progreso", value: stats.inProgressPatients },
    { name: "Pendientes", value: stats.pendingPatients },
    { name: "Sin Respuesta", value: stats.nonResponsivePatients },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Pacientes</CardTitle>
          <CardDescription>Distribución por estado actual</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No hay datos disponibles
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Pacientes</CardTitle>
        <CardDescription>Distribución por estado actual</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
