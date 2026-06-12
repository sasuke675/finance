import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ledger', icon: BookOpen, label: 'Ledger' },
  { to: '/debts', icon: Users, label: 'Hutang' },
  { to: '/analytics', icon: BarChart3, label: 'Analitik' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'active' : ''}`
          }
          id={`nav-${label.toLowerCase()}`}
        >
          <Icon className="bottom-nav__icon" />
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
