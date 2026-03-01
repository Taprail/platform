import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import { ToastProviderWrapper } from '@/hooks/use-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Overview from '@/pages/Overview'
import Transactions from '@/pages/Transactions'
import TransactionDetail from '@/pages/TransactionDetail'
import ApiKeys from '@/pages/ApiKeys'
import Webhooks from '@/pages/Webhooks'
import Team from '@/pages/Team'
import AuditLog from '@/pages/AuditLog'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProviderWrapper>
        <Routes>
          {/* Auth routes (public) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Dashboard routes (protected) */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/team" element={<Team />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        </ToastProviderWrapper>
      </AuthProvider>
    </BrowserRouter>
  )
}
