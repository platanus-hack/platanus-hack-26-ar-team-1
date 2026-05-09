"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, Clock, AlertTriangle, MessageSquare, FileImage } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

// Dashboard Stats Cards Component
export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Pacientes",
      value: stats.totalPatients,
      description: "Pacientes registrados",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Completados",
      value: stats.completedPatients,
      description: `${stats.completionRate.toFixed(1)}% tasa de completitud`,
      icon: CheckCircle,
      color: "text-[oklch(0.6_0.18_145)]",
    },
    {
      title: "En Progreso",
      value: stats.inProgressPatients,
      description: "Actualmente en tratamiento",
      icon: Clock,
      color: "text-[oklch(0.75_0.15_85)]",
    },
    {
      title: "Sin Respuesta",
      value: stats.nonResponsivePatients,
      description: "Requieren seguimiento",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Conversaciones",
      value: stats.totalConversations,
      description: "Mensajes totales",
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      title: "Multimedia",
      value: stats.mediaUploads,
      description: "Archivos subidos",
      icon: FileImage,
      color: "text-[oklch(0.65_0.15_200)]",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`size-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
