'use client'

export const runtime = 'edge';

import { redirect } from 'next/navigation'

// Redirect to the statistics page by default
export default function AccountingPage() {
  redirect('/accounting/statistics')
}
