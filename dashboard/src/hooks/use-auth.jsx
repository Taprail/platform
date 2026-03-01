import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [business, setBusiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('taprail_token')
    const savedUser = localStorage.getItem('taprail_user')
    const savedBusiness = localStorage.getItem('taprail_business')

    if (token && savedUser && savedBusiness) {
      setUser(JSON.parse(savedUser))
      setBusiness(JSON.parse(savedBusiness))
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData, business: bizData } = res.data
    api.setToken(token)
    localStorage.setItem('taprail_user', JSON.stringify(userData))
    localStorage.setItem('taprail_business', JSON.stringify(bizData))
    setUser(userData)
    setBusiness(bizData)
    return res
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, user: userData, business: bizData } = res.data
    api.setToken(token)
    localStorage.setItem('taprail_user', JSON.stringify(userData))
    localStorage.setItem('taprail_business', JSON.stringify(bizData))
    setUser(userData)
    setBusiness(bizData)
    return res
  }

  const logout = () => {
    api.clearToken()
    localStorage.removeItem('taprail_user')
    localStorage.removeItem('taprail_business')
    setUser(null)
    setBusiness(null)
  }

  const refreshBusiness = (bizData) => {
    localStorage.setItem('taprail_business', JSON.stringify(bizData))
    setBusiness(bizData)
  }

  return (
    <AuthContext.Provider value={{ user, business, isLoading, login, register, logout, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
