import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Zap, Rocket, CheckCircle, Star, Shield } from 'lucide-react';
import logoImg from '@/assets/logo.png';

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

  const benefits = [
    { icon: CheckCircle, text: 'Unlimited practice sessions' },
    { icon: Star, text: 'AI-powered feedback' },
    { icon: Shield, text: 'Private and secure' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#cb6ce6]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#24c4b8]/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logoImg} alt="Hiready" className="h-10 brightness-0 invert" />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#24c4b8]/20 text-[#24c4b8] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Rocket className="w-4 h-4" />
              Start for free
            </div>
            <h2 className="text-4xl font-bold mb-4">Level up your interview skills</h2>
            <p className="text-white/70 text-lg">Join thousands of candidates who landed their dream jobs</p>
          </div>
          
          <div className="space-y-3">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#24c4b8]/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#24c4b8]" />
                  </div>
                  <span className="text-white/80">{benefit.text}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#24c4b8] to-[#1db0a5] flex items-center justify-center text-lg font-bold">
                SK
              </div>
              <div>
                <p className="font-semibold">Sarah K.</p>
                <p className="text-white/60 text-sm">Software Engineer at Google</p>
              </div>
            </div>
            <p className="text-white/80 italic">"Hiready helped me prepare for my dream job. The AI feedback was incredibly detailed and actionable."</p>
            <div className="flex gap-1 mt-4">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4 fill-[#24c4b8] text-[#24c4b8]" />
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="text-white/50 text-sm">Trusted by candidates at top companies worldwide</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 bg-[#f8f7fc] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#6b1fad]/5 to-transparent lg:hidden" />
        <div className="absolute top-40 left-20 w-64 h-64 bg-[#cb6ce6]/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-sm relative">
          <div className="text-center mb-6 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
              <img src={logoImg} alt="Hiready" className="h-10" />
            </Link>
            <div className="inline-flex items-center gap-2 bg-[#24c4b8]/10 text-[#24c4b8] px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-[#24c4b8]/20">
              <Rocket className="w-3.5 h-3.5" />
              Start your journey
            </div>
          </div>
          
          <div className="lg:mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1a2e]">Create account</h1>
            <p className="text-gray-500 mt-2">Get started in less than a minute</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-7 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#1a1a2e] mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6b1fad]/20 focus:border-[#6b1fad] transition-all bg-[#f8f7fc]"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1a1a2e] mb-2">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6b1fad]/20 focus:border-[#6b1fad] transition-all bg-[#f8f7fc]"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1a1a2e] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6b1fad]/20 focus:border-[#6b1fad] transition-all bg-[#f8f7fc]"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a2e] mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6b1fad]/20 focus:border-[#6b1fad] transition-all bg-[#f8f7fc]"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#24c4b8] hover:bg-[#1db0a5] text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#24c4b8]/25 mt-2"
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

          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6b1fad] hover:text-[#5a1a91] font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
