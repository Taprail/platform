import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function AuthLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-foreground">
              <span className="text-[11px] font-semibold leading-none text-white">T</span>
            </div>
            <span className="text-[14px] font-semibold tracking-tight">Taprail</span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-3">Payment infrastructure for developers</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
