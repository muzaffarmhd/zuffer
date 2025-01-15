'use client'

import { Bot, Hash, MessageSquare, PlusCircle, Slash, Github, Pencil } from 'lucide-react'
import Image from 'next/image'

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "How To",
    url: "#",
    icon: MessageSquare,
  },
  {
    title: "Bot",
    url: "/configure",
    icon: Bot,
  },
  {
    title: "Embed",
    url: "/configure/embed",
    icon: Hash,
  },
  {
    title: "Channel Creator",
    url: "#",
    icon: PlusCircle,
  },
  {
    title: "Slash Commands",
    url: "#",
    icon: Slash,
  },
  {
    title: "Edit",
    url: "/configure/update",
    icon: Pencil,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="bg-gray-900 text-white">
      <SidebarHeader className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="text-xl text-white font-semibold"> Zuffer </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-white">
                    <a href={item.url} className="flex items-center space-x-3 text-white">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-800">
        <a 
          href="https://github.com/yourusername" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <Github className="h-5 w-5" />
          <span>GitHub</span>
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}

