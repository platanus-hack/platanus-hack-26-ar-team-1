"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Users, CheckCircle, AlertCircle } from "lucide-react"
import type { LabReport } from "@/lib/types"

interface LabReportsProps {
  reports: LabReport[]
}

export function LabReports({ reports }: LabReportsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          Reportes de Laboratorio
        </CardTitle>
        <CardDescription>
          Reportes generados por medicamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col gap-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay reportes disponibles
              </p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium truncate">
                        {report.drug_name}
                      </p>
                      <Badge variant="outline">
                        {new Date(report.generated_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{report.patient_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="size-4 text-[oklch(0.6_0.18_145)]" />
                        <span className="text-muted-foreground">Completados:</span>
                        <span className="font-medium">{report.completed_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="size-4 text-destructive" />
                        <span className="text-muted-foreground">Sin respuesta:</span>
                        <span className="font-medium">{report.non_responsive_count || 0}</span>
                      </div>
                    </div>
                    {report.report_json && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Tasa de adherencia: {(report.report_json as { adherence_rate?: number }).adherence_rate || 0}%
                      </div>
                    )}
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
