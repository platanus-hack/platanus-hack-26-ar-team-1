"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Activity, Brain, TrendingUp, TrendingDown } from "lucide-react"

interface AISignal {
  id: string
  patient_id: string
  patient_name: string
  signal_type: string
  confidence: number
  detected_at: string
  description: string
}

interface AISignalsProps {
  signals: AISignal[]
}

const getSignalIcon = (signalType: string) => {
  switch (signalType.toLowerCase()) {
    case "fatiga":
      return <Activity className="size-5 text-[oklch(0.65_0.15_85)]" />
    case "adherencia_baja":
      return <TrendingDown className="size-5 text-destructive" />
    case "mejoria":
      return <TrendingUp className="size-5 text-[oklch(0.6_0.18_145)]" />
    case "alerta":
      return <AlertTriangle className="size-5 text-[oklch(0.65_0.15_85)]" />
    default:
      return <Brain className="size-5 text-primary" />
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return "bg-[oklch(0.6_0.18_145)]/10 text-[oklch(0.5_0.18_145)]"
  if (confidence >= 0.6) return "bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.55_0.15_85)]"
  return "bg-muted text-muted-foreground"
}

export function AISignals({ signals }: AISignalsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          Señales de IA
        </CardTitle>
        <CardDescription>
          Patrones detectados automáticamente en pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col gap-3">
            {signals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay señales detectadas
              </p>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    {getSignalIcon(signal.signal_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {signal.patient_name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={getConfidenceColor(signal.confidence)}
                      >
                        {Math.round(signal.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground capitalize mb-1">
                      {signal.signal_type.replace("_", " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {signal.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(signal.detected_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
