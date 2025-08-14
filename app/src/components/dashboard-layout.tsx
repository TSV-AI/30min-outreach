"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Users, 
  Mail, 
  Settings, 
  Target,
  Home,
  Search,
  Plus
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Campaigns", href: "/campaigns", icon: Target },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Enrollments", href: "/enrollments", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-slate_gray-100 border-r border-slate_gray-300">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-powder_blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-slate_gray-100" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-seasalt-500">
                  VoiceAI Outreach
                </h1>
              </div>
            </div>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? "bg-powder_blue-400 text-slate_gray-100 shadow-sm"
                        : "text-silver-400 hover:bg-slate_gray-300 hover:text-seasalt-500",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? "text-slate_gray-100"
                          : "text-silver-400 group-hover:text-seasalt-500",
                        "mr-3 flex-shrink-0 h-5 w-5"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate_gray-300 p-4">
            <div className="flex items-center">
              <div>
                <div className="w-8 h-8 bg-silver-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate_gray-200">A</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-seasalt-500">Ava</p>
                <p className="text-xs text-silver-400">Three Sixty Vue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-slate_gray-100 border-b border-slate_gray-300">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-seasalt-500">
                {navigation.find(item => item.href === pathname)?.name || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-silver-400 text-silver-300 hover:bg-slate_gray-300">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button size="sm" className="bg-powder_blue-500 hover:bg-powder_blue-400 text-slate_gray-100">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}