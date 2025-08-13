
import {
  Calendar,
  Church,
  Home,
  Mail,
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  FileText,
  Search,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NavLink } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"
import { useIsAdmin } from "@/hooks/useProfile"

export function AppSidebar() {
  const { t } = useLanguage();
  const isAdmin = useIsAdmin();
  const { state } = useSidebar();

  const menuItems = [
    {
      title: t('navigation.dashboard'),
      url: "/",
      icon: Home,
    },
    {
      title: t('navigation.churches'),
      url: "/churches",
      icon: Church,
    },
    {
      title: t('navigation.discovery'),
      url: "/discover",
      icon: Search,
    },
    {
      title: t('navigation.campaigns'),
      url: "/campaigns", 
      icon: Mail,
    },
    {
      title: t('navigation.templates'),
      url: "/templates",
      icon: FileText,
    },
    {
      title: t('navigation.analytics'),
      url: "/analytics",
      icon: BarChart3,
    },
  ];

  const bottomMenuItems = [
    ...(isAdmin ? [{
      title: "User Management",
      url: "/user-management",
      icon: Users,
    }] : []),
    {
      title: t('navigation.settings'),
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Church className="h-6 w-6 text-primary" />
          {state !== "collapsed" && (
            <span className="font-semibold text-lg">Bridges Marketing</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {state === "collapsed" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={({ isActive }) =>
                              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                            }
                          >
                            <item.icon className="h-4 w-4" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {state === "collapsed" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={({ isActive }) =>
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                        }
                      >
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url}
                    className={({ isActive }) =>
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
