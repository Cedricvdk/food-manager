import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Calendar from './routes/Calendar'
import Recipes from './routes/Recipes'
import RecipeDetail from './routes/RecipeDetail'
import ShoppingList from './routes/ShoppingList'
import IngredientsAdmin from './routes/IngredientsAdmin'
import Settings from './routes/Settings'
import { requestAccessToken } from './lib/google/auth'
import { isTokenValid } from './store/authStore'

const queryClient = new QueryClient()

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/calendar" replace /> },
      { path: 'calendar', element: <Calendar /> },
      { path: 'recipes', element: <Recipes /> },
      { path: 'recipes/:name', element: <RecipeDetail /> },
      { path: 'shopping-list', element: <ShoppingList /> },
      { path: 'admin/ingredients', element: <IngredientsAdmin /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  useEffect(() => {
    if (isTokenValid()) return
    requestAccessToken({ silent: true }).catch(() => {
      // no prior session - user needs to sign in manually on /settings
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
