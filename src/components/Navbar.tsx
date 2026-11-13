import { useState } from 'react'
import { NavLink } from 'react-router'
import Logo from './Logo'

const links = [
  { to: '/',          label: 'Dashboard' },
  { to: '/projects',  label: 'Projects'  },
  { to: '/issues',    label: 'Issues'    },
  { to: '/team',      label: 'Team'      },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="w-full bg-[#0F2259] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold tracking-wide">
            <Logo size={32} />
            ITrack
          </NavLink>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/20'
                        : 'hover:bg-white/10'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10 focus:outline-none"
            aria-label="Toggle menu"
            onClick={() => setOpen(prev => !prev)}
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white my-1 transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <ul className="md:hidden px-4 pb-3 space-y-1">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/20' : 'hover:bg-white/10'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
