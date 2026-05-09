import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PatientsTable } from "@/components/dashboard/patients-table"
import { RetentionChart } from "@/components/dashboard/retention-chart"
import { StatusChart } from "@/components/dashboard/status-chart"
import { ConversationsList } from "@/components/dashboard/conversations-list"
import { MediaGallery } from "@/components/dashboard/media-gallery"
import { AISignals } from "@/components/dashboard/ai-signals"
import { LabReports } from "@/components/dashboard/lab-reports"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  mockStats,
  mockPatients,
  mockRetentionData,
  mockConversations,
  mockMediaItems,
  mockAISignals,
  mockLabReports,
} from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Stats Cards */}
            <StatsCards stats={mockStats} />
            
            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RetentionChart data={mockRetentionData} />
              <StatusChart stats={mockStats} />
            </div>
            
            {/* Tabs Section */}
            <Tabs defaultValue="patients" className="space-y-4">
              <TabsList className="bg-background">
                <TabsTrigger value="patients">Pacientes</TabsTrigger>
                <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
                <TabsTrigger value="media">Multimedia</TabsTrigger>
                <TabsTrigger value="signals">Señales IA</TabsTrigger>
                <TabsTrigger value="labs">Lab Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="patients" className="mt-4">
                <PatientsTable patients={mockPatients} />
              </TabsContent>
              
              <TabsContent value="conversations" className="mt-4">
                <ConversationsList conversations={mockConversations} patients={mockPatients} />
              </TabsContent>
              
              <TabsContent value="media" className="mt-4">
                <MediaGallery items={mockMediaItems} />
              </TabsContent>
              
              <TabsContent value="signals" className="mt-4">
                <AISignals signals={mockAISignals} />
              </TabsContent>
              
              <TabsContent value="labs" className="mt-4">
                <LabReports reports={mockLabReports} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
