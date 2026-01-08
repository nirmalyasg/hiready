import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Zap, Target, BarChart3, CheckCircle } from 'lucide-react';

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

      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(returnTo);
      } else {
        navigate('/interview');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#1e3a5f] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#60a5fa]/20 rounded-full blur-3xl" />
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
                Start your
                <span className="block text-[#60a5fa]">interview journey</span>
              </h1>
              <p className="text-white/60 text-lg mb-10">
                Join thousands of candidates improving their interview skills with AI-powered practice sessions.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#60a5fa]" />
                  </div>
                  <span className="text-white/80">10-minute AI interviews</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#60a5fa]" />
                  </div>
                  <span className="text-white/80">Role-specific questions</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#60a5fa]" />
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
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#042c4c]">Hiready</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-[#042c4c] mb-2">Create an account</h1>
              <p className="text-gray-500 mb-8">Start practicing interviews for free</p>

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
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#042c4c] mb-2">
                    Email <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    placeholder="Enter your email"
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
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#042c4c] mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white py-4 rounded-xl font-semibold hover:from-[#1d4ed8] hover:to-[#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Free to start • No credit card required
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold transition-colors">
                    Sign in
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
