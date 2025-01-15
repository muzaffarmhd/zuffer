import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <ToastProvider>
      <main className="w-full">
        <SidebarTrigger />
        {children}
      </main>
      <ToastViewport className="top-0 right-0 flex flex-col p-4 gap-2 w-full max-w-[420px] m-0 list-none z-[100] outline-none" />
      </ToastProvider>
    </SidebarProvider>
  )
}
