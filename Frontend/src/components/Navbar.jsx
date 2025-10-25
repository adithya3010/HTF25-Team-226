import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const NavLink = ({ to, children }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide text-slate-100/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
        isActive
          ? 'bg-gradient-to-r from-violet-500/80 via-violet-400/80 to-fuchsia-500/80 text-white shadow-[0_8px_20px_rgba(139,92,246,0.35)]'
          : 'hover:bg-white/10 hover:text-white/90 hover:shadow-sm'
      }`}
    >
      {children}
    </Link>
  )
}

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-gradient-to-r from-slate-950/95 via-[#1f1246]/90 to-[#402878]/80 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold uppercase tracking-[0.35em] text-white drop-shadow transition-colors hover:text-violet-200"
        >
          Chatroom
        </Link>

        <div className="flex items-center gap-2">
          <NavLink to="/">Rooms</NavLink>
          <NavLink to="/landingpage">Landing</NavLink>
          <NavLink to="/chat">Chat</NavLink>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
