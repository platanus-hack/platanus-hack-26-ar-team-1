"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2" />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Cohort Dashboard</h1>
          <span className="text-sm text-muted-foreground">Adherencia y multimedia</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="relative">
          <Search className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>
      </div>
    </header>
  )
}
