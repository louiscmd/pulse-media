import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/TopNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('name, onboarding_completed_at')
    .eq('user_id', user.id)
    .single()

  if (client && !client.onboarding_completed_at) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav clientName={client?.name} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
