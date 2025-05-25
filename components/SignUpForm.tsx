import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { AuthError } from '@supabase/supabase-js';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type?: string; content?: string }>({
    type: '',
    content: '',
  });

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({});
    
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0], // Default username
            full_name: email.split('@')[0]  // Default full name
          }
        }
      });

      if (signUpError) throw signUpError;

      if (user && !user.email_confirmed_at) {
        setMessage({
          type: 'success',
          content: 'Account created! Please check your email to confirm your account before signing in.',
        });
      } else if (user) {
        // Create profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: email.split('@')[0],
            full_name: email.split('@')[0],
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setMessage({
            type: 'success',
            content: 'Account created successfully! Please check your email to confirm your account.',
          });
        } else {
          setMessage({
            type: 'success',
            content: 'Account created successfully! Please check your email to confirm your account.',
          });
        }
      }

    } catch (error: unknown) {
      console.error('Signup error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof AuthError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
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

  return (
    <div className="w-full text-black max-w-md">
      <form onSubmit={handleSignup} className="space-y-6">
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
            Password (min 6 characters)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
          {loading ? 'Creating Account...' : 'Sign Up'}
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