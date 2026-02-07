import { Link, useLocation } from 'react-router-dom'

interface NavigationItem {
  name: string
  href: string
  current: boolean
}

export default function Header() {
  const location = useLocation()

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', current: location.pathname === '/' },
    { name: 'Create Campaign', href: '/campaigns/new', current: location.pathname === '/campaigns/new' },
    { name: 'Team Capacity', href: '/team', current: location.pathname === '/team' },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Campaign AI
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 text-sm font-medium transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
