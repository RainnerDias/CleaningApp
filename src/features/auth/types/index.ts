export interface LoginFormValues {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  avatarUrl: string | null
}
