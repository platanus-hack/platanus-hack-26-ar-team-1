"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mic, Image, Video, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import type { Conversation, Patient } from "@/lib/types"

interface ConversationsListProps {
  conversations: (Conversation & { patient?: Patient })[]
}

const messageTypeIcons = {
  text: MessageSquare,
  audio: Mic,
  image: Image,
  video: Video,
  document: FileText,
}

export function ConversationsList({ conversations }: ConversationsListProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    }
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Conversaciones Recientes</CardTitle>
        <CardDescription>
          Últimas interacciones con pacientes via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {conversations.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No hay conversaciones
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const Icon = messageTypeIcons[conv.message_type] || MessageSquare
                const DirectionIcon = conv.direction === "inbound" ? ArrowDownLeft : ArrowUpRight

                return (
                  <div
                    key={conv.id}
                    className="flex items-start gap-3 px-6 py-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {conv.patient ? getInitials(conv.patient.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {conv.patient?.name || "Paciente"}
                        </span>
                        <DirectionIcon 
                          className={`size-3.5 ${
                            conv.direction === "inbound" 
                              ? "text-[oklch(0.6_0.18_145)]" 
                              : "text-primary"
                          }`} 
                        />
                        <Badge variant="outline" className="shrink-0 gap-1">
                          <Icon className="size-3" />
                          {conv.message_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conv.content || (conv.media_url ? "[Archivo multimedia]" : "[Sin contenido]")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(conv.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(conv.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
