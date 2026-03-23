import { ReactNode, useState } from "react";
import { Menu, Settings, Users, MapPin, BarChart3, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="h-full px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-foreground">NATPAC</h1>
                    <p className="text-xs text-muted-foreground">Travel Diary</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-accent/10 rounded-full">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-slow"></div>
                  <span className="text-xs text-accent font-medium">Prototype</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}