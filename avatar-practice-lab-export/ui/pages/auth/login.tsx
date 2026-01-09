import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/interview';
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      const sessionReturnTo = sessionStorage.getItem('returnTo');
      if (sessionReturnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(sessionReturnTo);
      } else {
        window.location.href = decodeURIComponent(returnUrl);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fbfbfc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#042c4c]/5 to-transparent" />
      <div className="absolute top-20 right-20 w-64 h-64 bg-[#ee7e65]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#768c9c]/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-11 h-11 bg-[#042c4c] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#042c4c]">Hiready</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#042c4c]">Welcome back</h1>
          <p className="text-[#6c8194] mt-2">Sign in to continue your journey</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#042c4c] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#042c4c]/10 focus:border-[#042c4c] transition-all bg-[#fbfbfc]"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#042c4c] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#042c4c]/10 focus:border-[#042c4c] transition-all bg-[#fbfbfc]"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ee7e65] hover:bg-[#e06a50] text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ee7e65]/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6c8194] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#ee7e65] hover:text-[#e06a50] font-semibold">
            Create one
          </Link>
        </p>

        <p className="text-center text-[#768c9c] text-xs mt-10">
          © {new Date().getFullYear()} Hiready
        </p>
      </div>
    </div>
  );
}
