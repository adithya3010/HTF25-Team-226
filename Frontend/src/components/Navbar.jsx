import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { Button } from './ui/button'
import UserProfile from './UserProfile'

const NavLink = ({ to, children }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide text-slate-100/80 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
        isActive
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-900 text-white shadow-[0_12px_30px_rgba(76,29,149,0.4)] backdrop-blur border border-white/10'
          : 'hover:bg-white/10 hover:text-white/90 hover:shadow-[0_4px_18px_rgba(15,23,42,0.35)]'
      } ${isActive ? 'scale-105' : ''}`}
    >
      {children}
    </Link>
  )
}

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#080808] shadow-[0_15px_45px_rgba(8,12,30,0.6)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold uppercase tracking-[0.35em] text-white drop-shadow transition-colors hover:text-violet-200"
        >
          CORE
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <NavLink to="/">Home</NavLink>
            {!isAuthenticated && <NavLink to="/signin">Chat</NavLink>}
            {isAuthenticated && <NavLink to="/chat">Chat</NavLink>}
            {isAuthenticated && <UserProfile />}
          </div>
          
          <div className="ml-4 flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/90">{user?.name}</span>
                    {user?.isModerator && (
                      <span className="text-xs text-indigo-400">Moderator</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:opacity-90 hover:bg-white/10"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                className="bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:opacity-90"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
