"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Patient } from "@/lib/types"

interface PatientsTableProps {
  patients: Patient[]
}

const statusConfig = {
  pending: { label: "Pendiente", variant: "secondary" as const },
  in_progress: { label: "En Progreso", variant: "default" as const },
  completed: { label: "Completado", variant: "outline" as const },
  non_responsive: { label: "Sin Respuesta", variant: "destructive" as const },
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatPhone = (phone: string) => {
    if (phone.length >= 10) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`
    }
    return phone
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes</CardTitle>
        <CardDescription>
          Lista de pacientes registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay pacientes registrados
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPhone(patient.phone_number)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.drug_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[patient.status].variant}>
                      {statusConfig[patient.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(patient.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
