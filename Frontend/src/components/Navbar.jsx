import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const NavLink = ({ to, children }) => {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <Link
      to={to}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: 6,
        textDecoration: 'none',
        color: isActive ? 'white' : 'rgba(255,255,255,0.85)',
        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        transition: 'background 150ms ease'
      }}
    >
      {children}
    </Link>
  )
}

const Navbar = () => {
  return (
    <nav style={{ width: '100%', background: 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))', padding: '0.5rem 1rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            Chatroom
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavLink to="/">Rooms</NavLink>
          <NavLink to="/landingpage">Landing</NavLink>
          <NavLink to="/">Chat</NavLink>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
