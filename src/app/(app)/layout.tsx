import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopNav from '@/components/nav/TopNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, onboarding_completed_at')
    .eq('user_id', user.id)
    .single()

  if (client && !client.onboarding_completed_at) {
    redirect('/onboarding')
  }

  // Count edits awaiting the client's review
  let pendingEdits = 0
  if (client) {
    const { count } = await supabase
      .from('edits')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_review')
      .in(
        'content_idea_id',
        // subquery: idea IDs belonging to this client
        (
          await supabase
            .from('content_ideas')
            .select('id')
            .eq('client_id', client.id)
        ).data?.map((r) => r.id) ?? []
      )

    pendingEdits = count ?? 0
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav clientName={client?.name} pendingEdits={pendingEdits} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
