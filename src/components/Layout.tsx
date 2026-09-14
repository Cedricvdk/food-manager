import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/calendar', label: 'Calendar' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/shopping-list', label: 'Shopping List' },
  { to: '/admin/ingredients', label: 'Ingredients' },
  { to: '/settings', label: 'Settings' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 py-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
