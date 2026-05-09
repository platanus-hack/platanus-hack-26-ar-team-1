"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Activity, Brain, TrendingUp } from "lucide-react"

interface AISignal {
  id: string
  patientName: string
  signalType: string
  confidence: number
  detectedAt: string
  severity: "low" | "medium" | "high"
}

interface AISignalsProps {
  signals: AISignal[]
}

const signalIcons: Record<string, React.ReactNode> = {
  "fatiga": <Activity className="text-amber-500" />,
  "anomalía": <AlertTriangle className="text-red-500" />,
  "mejora": <TrendingUp className="text-emerald-500" />,
  "default": <Brain className="text-primary" />,
}

const severityColors: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function AISignals({ signals }: AISignalsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="size-5 text-primary" />
          Señales de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="flex flex-col gap-3">
            {signals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay señales detectadas
              </p>
            ) : (
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    {signalIcons[signal.signalType.toLowerCase()] || signalIcons.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {signal.patientName}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={severityColors[signal.severity]}
                      >
                        {signal.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {signal.signalType}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(signal.detectedAt).toLocaleDateString("es-ES", {
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
