import { Navigate, useLocation } from 'react-router'
import { homePathForRole, useAuth } from '../contexts/AuthContext'

export default function RequireAuth({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
