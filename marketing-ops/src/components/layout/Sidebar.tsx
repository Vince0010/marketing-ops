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
<<<<<<< HEAD
=======
import { Separator } from '@/components/ui/separator'
>>>>>>> e9f5b73659b236b5f465be020a7c6c519c8011a5
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NavLink {
  name: string
  href: string
  icon: React.ReactNode
}

<<<<<<< HEAD
export default function Sidebar() {
=======
interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
>>>>>>> e9f5b73659b236b5f465be020a7c6c519c8011a5
  const location = useLocation()

  const navLinks: NavLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'New Campaign', href: '/campaigns/new', icon: <PlusCircle className="w-5 h-5" /> },
    { name: 'Team', href: '/team', icon: <Users className="w-5 h-5" /> },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard'
    return location.pathname.startsWith(href)
  }

  return (
<<<<<<< HEAD
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col min-h-screen">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 px-4 h-14 border-b border-border"
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold truncate">
          MarketingOps<span className="text-primary">.ai</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navLinks.map((link) => (
          <Link key={link.name} to={link.href}>
            <Button
              variant={isActive(link.href) ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-3 h-9 px-3"
            >
              {link.icon}
              <span>{link.name}</span>
=======
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
>>>>>>> e9f5b73659b236b5f465be020a7c6c519c8011a5
            </Button>
          </Link>
        ))}
      </nav>

<<<<<<< HEAD
      {/* Bottom: notifications + user */}
      <div className="p-2 border-t border-border space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-9 px-3 relative">
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
          <Badge className="ml-auto h-5 min-w-5 flex items-center justify-center px-1 text-[10px]" variant="destructive">
            3
          </Badge>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 h-9 px-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="truncate text-sm">Demo User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-48">
=======
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
>>>>>>> e9f5b73659b236b5f465be020a7c6c519c8011a5
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
<<<<<<< HEAD
            <DropdownMenuItem className="text-destructive">
=======
            <DropdownMenuItem className="text-red-600">
>>>>>>> e9f5b73659b236b5f465be020a7c6c519c8011a5
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
