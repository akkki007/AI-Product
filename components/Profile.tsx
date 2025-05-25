import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div className="space-y-4 text-black">
      <h2 className="text-xl font-bold">Profile</h2>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Logout
      </button>
      <Link href="/chat">
      <button
        className="px-4 py-2 font-medium bg-yellow-400 mx-5 rounded-md text-zinc-700"
      >
        Chat
      </button>
      </Link>
    </div>
  );
}