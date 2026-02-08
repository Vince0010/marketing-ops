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
<<<<<<< HEAD
<<<<<<< HEAD
  Sun,
  Moon,
=======
>>>>>>> 1fe4725 (Added Components)
=======
  Sun,
  Moon,
>>>>>>> 32db48f (Added Many components, ref in tab 5)
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const THEME_KEY = 'marketing_ops_theme'

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
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem(THEME_KEY, 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem(THEME_KEY, 'light')
    }
  }, [dark])

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
    <aside className={`w-64 bg-card border-r border-border fixed left-0 top-0 bottom-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } md:translate-x-0`}>
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            MarketingOps<span className="text-primary">.ai</span>
          </span>
        </Link>
      </div>

      <Separator />

      {/* Theme switch: Light / Dark */}
      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Theme</p>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setDark(false)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              !dark ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={!dark}
            aria-label="Light mode"
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setDark(true)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              dark ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={dark}
            aria-label="Dark mode"
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
        </div>
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
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
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
            <DropdownMenuItem onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              Switch to {dark ? 'light' : 'dark'} mode
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
