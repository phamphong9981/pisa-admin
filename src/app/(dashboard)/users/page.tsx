export const runtime = 'edge';

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import UserInfo from '@views/users/UserInfo'

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
  description: 'Quản lý thông tin người dùng'
}

const UsersPage = () => {
  return <UserInfo />
}

export default UsersPage


