import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban,
  FileText, Receipt, Settings, LogOut, ClipboardList
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import s from './Layout.module.css'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/clientes',     icon: Users,           label: 'Clientes'      },
  { to: '/proyectos',    icon: FolderKanban,    label: 'Proyectos'     },
  { to: '/presupuestos', icon: ClipboardList,   label: 'Presupuestos'  },
  { to: '/facturas',     icon: FileText,        label: 'Facturas'      },
  { to: '/tickets',      icon: Receipt,         label: 'Tickets'       },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={s.root}>
      <aside className={s.sidebar}>
        {/* Logo */}
        <div className={s.logo}>
          <div className={s.logoBox}>
            <span className={s.logoScript}>Abel Bou</span>
            <span className={s.logoSub}>Gestión</span>
          </div>
        </div>

        <nav className={s.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `${s.link} ${isActive ? s.active : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={s.bottom}>
          <NavLink to="/ajustes"
            className={({ isActive }) => `${s.link} ${isActive ? s.active : ''}`}>
            <Settings size={16} strokeWidth={2} />
            <span>Ajustes</span>
          </NavLink>
          <div className={s.user}>
            <div className={s.userAvatar}>{user?.name?.[0] || 'A'}</div>
            <div className={s.userInfo}>
              <div className={s.userName}>{user?.name}</div>
              <div className={s.userEmail}>{user?.email}</div>
            </div>
            <button className={s.logout} onClick={() => { logout(); navigate('/login') }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className={s.main}>
        {children}
      </main>
    </div>
  )
}
