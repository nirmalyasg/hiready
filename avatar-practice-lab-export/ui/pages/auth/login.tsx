import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Zap, Target, TrendingUp, Award } from 'lucide-react';
import logoImg from '@/assets/logo.png';

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

      if (data.role === 'admin') {
        window.location.href = '/admin';
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

  const features = [
    { icon: Target, title: 'AI Interview Practice', description: 'Practice with realistic AI avatars' },
    { icon: TrendingUp, title: 'Track Progress', description: 'See your improvement over time' },
    { icon: Award, title: 'Get Feedback', description: 'Detailed insights on every session' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#031d33] via-[#042c4c] to-[#031d33] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ee7e65]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#768c9c]/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logoImg} alt="Hiready" className="h-10 brightness-0 invert" />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">Welcome back</h2>
            <p className="text-white/70 text-lg">Continue your interview preparation journey</p>
          </div>
          
          <div className="space-y-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="w-10 h-10 bg-[#ee7e65] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-white/60 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#ee7e65] flex items-center justify-center text-xs font-bold ring-2 ring-[#042c4c]">JD</div>
            <div className="w-8 h-8 rounded-full bg-[#768c9c] flex items-center justify-center text-xs font-bold ring-2 ring-[#042c4c]">MK</div>
            <div className="w-8 h-8 rounded-full bg-[#f5a594] flex items-center justify-center text-xs font-bold ring-2 ring-[#042c4c]">AS</div>
          </div>
          <p className="text-white/70 text-sm">Join 10,000+ candidates practicing daily</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 bg-[#f8f9fb] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#ee7e65]/5 to-transparent lg:hidden" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#ee7e65]/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-sm relative">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <img src={logoImg} alt="Hiready" className="h-10" />
            </Link>
          </div>
          
          <div className="lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#042c4c]">Sign in</h1>
            <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-7 mt-6">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] transition-all bg-[#f8f9fb]"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ee7e65] hover:bg-[#e06d54] text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ee7e65]/25"
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

          <p className="text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#ee7e65] hover:text-[#e06d54] font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
