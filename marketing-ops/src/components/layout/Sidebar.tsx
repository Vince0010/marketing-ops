import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  Zap,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NavLink {
  name: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation()

  const navLinks: NavLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'New Campaign', href: '/campaigns/new', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'Templates', href: '/templates', icon: <FileText className="w-5 h-5" /> },
    { name: 'Team', href: '/team', icon: <Users className="w-5 h-5" /> },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname.startsWith(href)
  }

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0`}>
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            MarketingOps<span className="text-blue-600">.ai</span>
          </span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => (
          <Link key={link.name} to={link.href} onClick={() => onClose?.()}>
            <Button
              variant={isActive(link.href) ? 'default' : 'ghost'}
              className="w-full justify-start gap-3"
            >
              {link.icon}
              {link.name}
            </Button>
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Bottom section: notifications + user */}
      <div className="p-4 space-y-3">
        {/* Notifications */}
        <Button variant="ghost" className="w-full justify-start gap-3 relative">
          <Bell className="w-5 h-5" />
          Notifications
          <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px]" variant="destructive">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm">Demo User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
