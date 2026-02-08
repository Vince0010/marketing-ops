import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}

export function PageLayout({ children, title, description, actions }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="container mx-auto px-8 py-8">
          {(title || description || actions) && (
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-gray-600">
                      {description}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-3">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {children}
        </div>
      </main>
    </div>
  )
}