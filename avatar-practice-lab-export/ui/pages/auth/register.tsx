import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Zap, Rocket } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fbfbfc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#042c4c]/5 to-transparent" />
      <div className="absolute top-40 left-20 w-64 h-64 bg-[#ee7e65]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-20 w-64 h-64 bg-[#768c9c]/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 bg-[#042c4c] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#042c4c]">Hiready</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#ee7e65]/10 text-[#ee7e65] px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-[#ee7e65]/20">
            <Rocket className="w-3.5 h-3.5" />
            Start your journey
          </div>
          <h1 className="text-2xl font-bold text-[#042c4c]">Create account</h1>
          <p className="text-[#6c8194] mt-2">Join thousands of successful candidates</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#042c4c] mb-2">
                Email <span className="text-[#768c9c]">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#042c4c]/10 focus:border-[#042c4c] transition-all bg-[#fbfbfc]"
                placeholder="your@email.com"
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
                placeholder="At least 6 characters"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#042c4c] placeholder:text-[#768c9c] focus:outline-none focus:ring-2 focus:ring-[#042c4c]/10 focus:border-[#042c4c] transition-all bg-[#fbfbfc]"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ee7e65] hover:bg-[#e06a50] text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#ee7e65]/25 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6c8194] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#ee7e65] hover:text-[#e06a50] font-semibold">
            Sign in
          </Link>
        </p>

        <p className="text-center text-[#768c9c] text-xs mt-10">
          © {new Date().getFullYear()} Hiready
        </p>
      </div>
    </div>
  );
}
