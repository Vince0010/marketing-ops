import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background expedition-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="ml-0 md:ml-64">
        {/* Mobile hamburger button */}
        <div className="md:hidden fixed top-4 left-4 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="bg-card shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <main className="px-8 py-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
