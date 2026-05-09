"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LabReport } from "@/lib/types"

interface LabReportsProps {
  reports: LabReport[]
}

export function LabReports({ reports }: LabReportsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5 text-primary" />
          Reportes de Laboratorio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="flex flex-col gap-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay reportes disponibles
              </p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">
                        {report.report_type}
                      </p>
                      <Badge variant="outline">
                        {new Date(report.report_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {report.summary || "Sin resumen disponible"}
                    </p>
                  </div>
                  {report.file_url && (
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Download className="size-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
