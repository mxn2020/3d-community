// app/page.tsx
import CommunitySpaceWithAuth from "@/components/community-space-with-auth"
import { createSupabaseServerClient } from '@/lib/db';
import { getUserAccount } from '@/lib/utils/account'; // Assuming this is the correct path

export async function Home() {
  const supabase = await createSupabaseServerClient(); // Create Supabase server client
  const { user, userId, accountId } = await getUserAccount(supabase); // Fetch auth data

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-green-100">
      <div className="w-full h-screen" style={{ background: 'transparent', overflow: 'hidden' }}>
        <CommunitySpaceWithAuth
          user={user}
          userId={userId}
          accountId={accountId}
         />
      </div>
    </main>
  )
}

export default Home;