import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import { ToastProviderWrapper } from '@/hooks/use-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

import Landing from '@/pages/Landing'
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
import KybOnboarding from '@/pages/KybOnboarding'
import KybStatus from '@/pages/KybStatus'
import ApiDocs from '@/pages/ApiDocs'
import PublicDocs from '@/pages/PublicDocs'
import PublicSdk from '@/pages/PublicSdk'
import Customers from '@/pages/Customers'
import CustomerDetail from '@/pages/CustomerDetail'
import Refunds from '@/pages/Refunds'
import Settlements from '@/pages/Settlements'
import Disputes from '@/pages/Disputes'
import DisputeDetail from '@/pages/DisputeDetail'
import NotificationSettings from '@/pages/NotificationSettings'
import Demo from '@/pages/Demo'
import QuickStart from '@/pages/QuickStart'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProviderWrapper>
        <Routes>
          {/* Landing page (public root) */}
          <Route path="/" element={<Landing />} />

          {/* Public docs (no auth required) */}
          <Route path="/docs" element={<PublicDocs />} />
          <Route path="/sdk" element={<PublicSdk />} />

          {/* Auth routes (public) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Dashboard routes (protected) */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/disputes/:id" element={<DisputeDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/team" element={<Team />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/kyb" element={<KybOnboarding />} />
            <Route path="/kyb/status" element={<KybStatus />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/quickstart" element={<QuickStart />} />
          </Route>
        </Routes>
        </ToastProviderWrapper>
      </AuthProvider>
    </BrowserRouter>
  )
}
