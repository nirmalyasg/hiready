import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import a3cendLogo from '@/assets/a3cend-logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email: email || undefined, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      navigate('/avatar/start');
    } catch (err) {
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
            <h1 className="text-2xl font-bold text-brand-dark mb-2 text-center">Create an account</h1>
            <p className="text-brand-muted text-center mb-8">Start practicing conversations today</p>

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
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">
                  Email <span className="text-brand-muted">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all duration-200"
                  placeholder="Enter your email"
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
                  placeholder="Create a password (min 6 characters)"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-dark mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all duration-200"
                  placeholder="Confirm your password"
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-brand-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-accent hover:text-brand-accent/80 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
