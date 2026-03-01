const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082'

class ApiClient {
  getToken() {
    return localStorage.getItem('taprail_token')
  }

  setToken(token) {
    localStorage.setItem('taprail_token', token)
  }

  clearToken() {
    localStorage.removeItem('taprail_token')
  }

  async request(path, options = {}) {
    const token = this.getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      this.clearToken()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }

    return data
  }

  get(path) {
    return this.request(path)
  }

  post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  put(path, body) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
