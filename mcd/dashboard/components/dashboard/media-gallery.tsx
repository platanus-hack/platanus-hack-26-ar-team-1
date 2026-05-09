"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, Mic, Video, FileText } from "lucide-react"
import type { Conversation } from "@/lib/types"

interface MediaGalleryProps {
  media: Conversation[]
}

const mediaTypeConfig = {
  image: { icon: ImageIcon, label: "Imagen", color: "bg-[oklch(0.6_0.18_145)]/10 text-[oklch(0.6_0.18_145)]" },
  audio: { icon: Mic, label: "Audio", color: "bg-primary/10 text-primary" },
  video: { icon: Video, label: "Video", color: "bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.65_0.15_85)]" },
  document: { icon: FileText, label: "Documento", color: "bg-muted text-muted-foreground" },
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multimedia Reciente</CardTitle>
        <CardDescription>
          Archivos multimedia enviados por pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No hay archivos multimedia
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => {
              const config = mediaTypeConfig[item.message_type as keyof typeof mediaTypeConfig] || mediaTypeConfig.document
              const Icon = config.icon

              return (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className={`p-3 rounded-full ${config.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
