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
  Mountain,
  Package,
  Radio,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    { name: 'Summit Control Center', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Begin Ascent', href: '/campaigns/new', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'Supply Cache', href: '/templates', icon: <Package className="w-5 h-5" /> },
    { name: 'Expedition Team', href: '/team', icon: <Users className="w-5 h-5" /> },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname.startsWith(href)
  }

  return (
    <aside className={`w-64 bg-expedition-inkBlack border-r border-white/10 fixed left-0 top-0 bottom-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0`}>
      {/* Header gradient + Logo */}
      <div className="bg-expedition-yaleBlue border-b border-white/10">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-expedition-camp-1">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              MarketingOps<span className="text-primary">.ai</span>
            </span>
          </Link>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Base Camp Menu */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Base Camp Menu">
        {navLinks.map((link) => (
          <Link key={link.name} to={link.href} onClick={() => onClose?.()}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-white/90 hover:text-white hover:bg-white/10',
                isActive(link.href) && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {link.icon}
              {link.name}
            </Button>
          </Link>
        ))}
      </nav>

      <Separator className="bg-white/10" />

      {/* Bottom section: notifications + user */}
      <div className="p-4 space-y-3">
        <Button variant="ghost" className="w-full justify-start gap-3 relative text-white/90 hover:text-white hover:bg-white/10">
          <Radio className="w-5 h-5" />
          Weather Alerts
          <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-white border-0">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 text-white/90 hover:text-white hover:bg-white/10">
              <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
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
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
