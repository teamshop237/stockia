import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { GuestRoute } from './routes/GuestRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { TeamPage } from './pages/TeamPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminOrganizationsPage } from './pages/admin/AdminOrganizationsPage'
import { AdminOrganizationDetailPage } from './pages/admin/AdminOrganizationDetailPage'

function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="organizations" replace />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="organizations/:id" element={<AdminOrganizationDetailPage />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="onboarding" element={<OnboardingPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="team" element={<TeamPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
