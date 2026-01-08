import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, CheckCircle, Zap, Target, BarChart3 } from 'lucide-react';

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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#042c4c] via-[#0a3d62] to-[#042c4c] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ee7e65]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#768c9c]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Hiready</span>
          </Link>

          {/* Main Content */}
          <div className="flex-1 flex items-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-white mb-6">
                Welcome back to
                <span className="block text-[#ee7e65]">interview success</span>
              </h1>
              <p className="text-white/60 text-lg mb-10">
                Continue practicing and improving your interview skills with AI-powered feedback.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#ee7e65]" />
                  </div>
                  <span className="text-white/80">10-minute AI interviews</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#ee7e65]" />
                  </div>
                  <span className="text-white/80">Role-specific questions</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#ee7e65]" />
                  </div>
                  <span className="text-white/80">Instant feedback & scoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Hiready
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-[#f8fafc]">
        {/* Mobile Header */}
        <header className="lg:hidden px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#042c4c] to-[#0a3d62] rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#042c4c]">Hiready</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-[#042c4c] mb-2">Welcome back</h1>
              <p className="text-gray-500 mb-8">Sign in to continue practicing</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
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
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all"
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
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#ee7e65] to-[#e06a50] text-white py-4 rounded-xl font-semibold hover:from-[#e06a50] hover:to-[#d55a40] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ee7e65]/20"
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
                <p className="text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#ee7e65] hover:text-[#e06a50] font-semibold transition-colors">
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm mt-8 lg:hidden">
              © {new Date().getFullYear()} Hiready
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
