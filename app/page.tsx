"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import LoginForm from '@/components/LoginForm';
import SignUpForm from '@/components/SignUpForm';
import { redirect } from 'next/navigation';

export default function Home() {
  const [session, setSession] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<unknown>(null);
useEffect(() => {
  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if(user){
        redirect('/chat');
      }
      if (error) {
        console.error('Error fetching user:', error);
      } 
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };
  console.log(user);
  
  fetchUser();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
}, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">   
            <>
              <div className="flex mb-6 border-b">
                <button
                  className={`px-4 py-2 font-medium ${
                    session === 'login'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setSession('login')}
                >
                  Login
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    session === 'signup'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setSession('signup')}
                >
                  Sign Up
                </button>
              </div>
              {session === 'login' ? <LoginForm /> : <SignUpForm />}
            </>
        </div>
      </div>
    </div>
  );
}