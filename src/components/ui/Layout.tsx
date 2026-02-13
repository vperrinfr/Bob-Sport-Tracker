import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 100 100"
                  fill="none"
                >
                  <circle cx="50" cy="50" r="48" fill="#0ea5e9" stroke="#0284c7" strokeWidth="2"/>
                  <g fill="#ffffff">
                    <circle cx="45" cy="25" r="8"/>
                    <path d="M 45 33 L 45 50 L 38 65 L 42 66 L 48 52 L 54 66 L 58 65 L 50 50 L 50 33 Z"/>
                    <path d="M 45 35 L 35 45 L 37 48 L 45 40 Z"/>
                    <path d="M 50 35 L 60 42 L 58 45 L 50 38 Z"/>
                    <path d="M 38 65 L 32 78 L 36 80 L 42 66 Z"/>
                    <path d="M 54 66 L 62 75 L 66 73 L 58 65 Z"/>
                  </g>
                  <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6">
                    <line x1="20" y1="30" x2="28" y2="30"/>
                    <line x1="18" y1="40" x2="28" y2="40"/>
                    <line x1="22" y1="50" x2="32" y2="50"/>
                  </g>
                  <path d="M 20 85 L 25 85 L 28 80 L 31 90 L 34 85 L 80 85"
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"/>
                </svg>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Bob-Sport-Tracker
                </span>
              </Link>

              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Tableau de bord
                </Link>
                <Link
                  to="/activities"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/activities')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Activités
                </Link>
                <Link
                  to="/statistics"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/statistics')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  📊 Statistiques
                </Link>
                <Link
                  to="/records"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/records')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  🏆 Records
                </Link>
                <Link
                  to="/zones"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/zones')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  💓 Zones
                </Link>
                <Link
                  to="/upload"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/upload')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Importer
                </Link>
                <Link
                  to="/strava/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    location.pathname.startsWith('/strava')
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                  </svg>
                  Strava
                </Link>
              </nav>
            </div>

            {/* Theme toggle removed - dark mode only */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2026 Bob-Sport-Tracker - Made with Bob
          </p>
        </div>
      </footer>
    </div>
  );
}

// Made with Bob