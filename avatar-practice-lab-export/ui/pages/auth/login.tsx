import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import a3cendLogo from '@/assets/a3cend-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/avatar/start';
  
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

      window.location.href = decodeURIComponent(returnUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={a3cendLogo} alt="A3CEND" className="h-8" />
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm font-semibold text-brand-dark tracking-tight">AI Practice Lab</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-brand-dark mb-2 text-center">Welcome back</h1>
            <p className="text-brand-muted text-center mb-8">Sign in to continue practicing</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-brand-accent/10 text-brand-accent px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-brand-dark mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all duration-200"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-dark text-white py-3.5 rounded-xl font-semibold hover:bg-brand-dark/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-brand-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-accent hover:text-brand-accent/80 font-semibold transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
