"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, ChevronUp, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function SidebarUser() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = () => {
    logout()
  }

  const handleNavigateToProfile = () => {
    router.push("/profile")
  }

  const handleNavigateToSettings = () => {
    router.push("/budget-settings")
  }

  const handleNavigateToOrganization = () => {
    router.push("/settings/organization")
  }

  return (
    <div className="border-t border-gray-200/60 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-2 px-2 hover:bg-gray-100 rounded-lg group"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="" alt={user.full_name} />
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-gray-400 group-data-[collapsible=icon]:hidden" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-56 mb-2">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.company_name && (
                <p className="text-xs text-gray-500">{user.company_name}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNavigateToProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToOrganization}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Organization</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Budget Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
