import * as React from "react"
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  User2,
  Package,
  BarChart3,
  Microscope,
  Pill,
  Heart,
  Stethoscope,
  ClipboardList,
  Receipt,
  FileText,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useSettingsStore } from "@/store/settingsStore"
import { useStableClinicName, useStableDoctorName, useStableClinicLogo } from "@/hooks/useStableSettings"

// Navigation items data
const navigationItems = [
  {
    title: "لوحة التحكم",
    url: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "المرضى",
    url: "patients",
    icon: Users,
  },
  {
    title: "المواعيد",
    url: "appointments",
    icon: Calendar,
  },
  {
    title: "المدفوعات",
    url: "payments",
    icon: CreditCard,
  },
  {
    title: "المخزون",
    url: "inventory",
    icon: Package,
  },
  {
    title: "المختبرات",
    url: "labs",
    icon: Microscope,
  },
  {
    title: "الأدوية والوصفات",
    url: "medications",
    icon: Pill,
  },
  {
    title: "العلاجات السنية",
    url: "dental-treatments",
    icon: Heart,
  },
  {
    title: "احتياجات العيادة",
    url: "clinic-needs",
    icon: ClipboardList,
  },
  {
    title: "مصروفات العيادة",
    url: "expenses",
    icon: Receipt,
  },
  {
    title: "التقارير",
    url: "reports",
    icon: BarChart3,
  },
  {
    title: "فاتورة تقديرية ",
    url: "external-estimate",
    icon: FileText,
  },
  {
    title: "الإعدادات",
    url: "settings",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
  const { settings } = useSettingsStore()
  const clinicName = useStableClinicName()
  const doctorName = useStableDoctorName()
  const clinicLogo = useStableClinicLogo()

  return (
    <Sidebar collapsible="offcanvas" side="right" className="border-l border-border/40 shadow-lg rtl-layout" {...props}>
      <SidebarHeader className="border-b border-border/40 bg-gradient-to-l from-background to-accent/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200 flex-rtl">
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg overflow-hidden">
                  {clinicLogo && clinicLogo.trim() !== '' ? (
                    <img
                      src={clinicLogo}
                      alt="شعار العيادة"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Sidebar header logo failed to load:', clinicLogo)
                        // Fallback to default icon
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const fallbackIcon = document.createElement('div')
                          fallbackIcon.innerHTML = '<svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                          parent.appendChild(fallbackIcon)
                        }
                      }}
                    />
                  ) : (
                    <Stethoscope className="size-6" />
                  )}
                </div>
                <div className="grid flex-1 text-right leading-tight">
                  <span className="truncate font-bold text-xl text-foreground">
                    {clinicName}
                  </span>
                  <span className="truncate text-sm text-muted-foreground font-medium">
                    نظام إدارة العيادة
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3">
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-2 py-2 text-right">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 nav-rtl">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={activeTab === item.url}
                    onClick={() => onTabChange(item.url)}
                    className="flex items-center gap-3 w-full text-right justify-start hover:bg-accent/50 transition-colors duration-200 py-2 px-3 text-base nav-item"
                  >
                    <item.icon className="size-5 text-sky-600 dark:text-sky-400 nav-icon" />
                    <span className="font-semibold text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-r from-background to-accent/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white overflow-hidden">
                {clinicLogo && clinicLogo.trim() !== '' ? (
                  <img
                    src={clinicLogo}
                    alt="شعار العيادة"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      console.error('Sidebar footer logo failed to load:', clinicLogo)
                      // Fallback to default icon
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const fallbackIcon = document.createElement('div')
                        fallbackIcon.innerHTML = '<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                        parent.appendChild(fallbackIcon)
                      }
                    }}
                  />
                ) : (
                  <User2 className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-right leading-tight">
                <span className="truncate font-semibold text-sm">د. {doctorName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {clinicName}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
