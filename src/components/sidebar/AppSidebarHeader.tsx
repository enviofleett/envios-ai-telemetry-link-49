
import { useSidebar } from "@/components/ui/sidebar"
import { SidebarHeader as ShadcnSidebarHeader } from "@/components/ui/sidebar"

export function AppSidebarHeader() {
  const { state } = useSidebar()

  return (
    <ShadcnSidebarHeader>
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        {state === "expanded" && (
          <div>
            <p className="text-sm font-semibold">Envio Fleet</p>
            <p className="text-xs text-muted-foreground">Management Platform</p>
          </div>
        )}
      </div>
    </ShadcnSidebarHeader>
  )
}
