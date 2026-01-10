import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo.png';

export default function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/enterprise', label: 'Enterprise' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b transition-shadow duration-200 ${scrolled ? 'shadow-md border-gray-200' : 'shadow-sm border-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-[72px] flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImg} alt="Hiready" className="h-9" />
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-[#6b1fad]'
                  : 'text-gray-600 hover:text-[#6b1fad]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/demo">
            <Button variant="outline" size="sm" className="border-[#6b1fad]/20 text-[#6b1fad] hover:bg-[#6b1fad]/5 gap-2 h-10 px-4">
              <Calendar className="w-4 h-4" />
              Book a Demo
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#6b1fad] h-10 px-4">
              Sign In
            </Button>
          </Link>
          <Link to="/readycheck">
            <Button size="sm" className="bg-[#24c4b8] hover:bg-[#1db0a5] text-white shadow-lg shadow-[#24c4b8]/25 border-0 h-10 px-5 font-semibold">
              Start Preparing
            </Button>
          </Link>
        </div>

        <button 
          className="md:hidden p-2 text-[#6b1fad] hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-[72px] right-0 bottom-0 w-[280px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex-1 p-6 space-y-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block py-3 px-4 rounded-xl text-base font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#6b1fad]/5 text-[#6b1fad]'
                      : 'text-[#6b1fad] hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/demo"
                className="block py-3 px-4 rounded-xl text-base font-medium text-[#6b1fad] hover:bg-gray-50"
              >
                Book a Demo
              </Link>
              <Link
                to="/login"
                className="block py-3 px-4 rounded-xl text-base text-gray-600 hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
            <div className="p-6 border-t border-gray-100">
              <Link to="/readycheck">
                <Button className="w-full h-12 bg-[#24c4b8] hover:bg-[#1db0a5] text-white shadow-lg font-semibold text-base">
                  Start Preparing
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
