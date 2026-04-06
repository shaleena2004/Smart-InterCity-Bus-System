 import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/',           icon: '⊞',  label: 'Dashboard'  },
  { to: '/revenue',    icon: '💳',  label: 'Revenue'    },
  { to: '/salary',     icon: '👤',  label: 'Payroll'    },
  { to: '/commission', icon: '🚌',  label: 'Commission' },
  { to: '/reports',    icon: '📊',  label: 'Reports'    },
];

export default function Navbar() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? 'nav-icon-wrap' : ''}>
                <span className="nav-icon">{icon}</span>
              </span>
              <span className="nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
