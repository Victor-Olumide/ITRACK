// Admin/technician new-ticket entry point.

import { useAuth } from '../contexts/AuthContext'
import EmployeePortal from './EmployeePortal'

export default function NewTicket() {
  const { user } = useAuth()
  return <EmployeePortal section="report" viewer={user} />
}
