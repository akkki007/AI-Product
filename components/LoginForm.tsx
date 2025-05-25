"use client"
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation'; 

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type?: string; content?: string }>({
    type: '',
    content: '',
  });
  
  const router = useRouter(); 

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage({
          type: 'success',
          content: 'Successfully signed in! Redirecting...',
        });
        
      
        setTimeout(() => {
          router.push('/chat'); 
        }, 1000);
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        content: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage({});
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat` // Add redirect URL
        }
      });

      if (error) throw error;
      console.log(data);
      
      
    } catch (error: unknown) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Failed to sign in with Google.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        content: errorMessage
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-black max-w-md">
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Loading...' : 'Sign In with Google'}
        </button>

        {message.content && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message.content}
          </div>
        )}
      </form>
    </div>
  );
}