import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Re-enabled this import
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// This component can be shared or defined in both files
const IdLogo = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* SVG paths for the top-left logo */}
    </svg>
);

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth(); // Using the REAL register function from your context

  // The dummy register function has been removed.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSuccess(false);

    try {
      // This now calls the REAL register function from your AuthContext
      await register(email, username, password, name, surname);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="relative min-h-screen w-full bg-[#0F0F0F] text-white font-noto-sans overflow-hidden">
        {/* Background Image Element */}
          <div
              className="absolute w-[2200px] h-[1680px] -left-[150px] top-[-350px] z-0"
              style={{
                  backgroundImage: `url('/login_background.png')`, // Path from the public folder
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  transform: 'rotate(1deg)',
              }}
          ></div>

        {/* Content Container */}
        <div className="relative z-10 min-h-screen w-full grid md:grid-cols-2 bg-black/20 p-8 sm:p-12">
          {/* Left Section: Branding */}
          <div className="hidden md:flex flex-col justify-between py-8">
            <IdLogo />
            <div className="pl-4">
              <img src="/login_logo.png" alt="IDRE Logo" className="w-[561px] ml-[65px]" />
            </div>
            <div /> {/* Spacer div */}
          </div>

          {/* Right Section: Register Form */}
          <div className="flex items-center justify-center py-10">
            <div className="w-full max-w-md">
              <div
                  className="bg-black/20 border border-white/20 rounded-2xl shadow-xl shadow-black/30 backdrop-blur-lg"
                  style={{ background: 'linear-gradient(321.23deg, rgba(191, 191, 191, 0.062) 5.98%, rgba(0, 0, 0, 0) 66.28%), rgba(0, 0, 0, 0.14)' }}
              >
                <form onSubmit={handleSubmit} className="p-12 space-y-4">
                  <div className="mb-6 text-center">
                    <h2 className="font-montserrat-alt text-4xl font-semibold">Create Account</h2>
                    <p className="font-montserrat-alt text-white/80 mt-2">Join us to get started</p>
                  </div>

                  {/* Error and Success Messages */}
                  {error && (
                      <div className="bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg p-3 text-sm flex items-start gap-2">
                        <span>⚠️</span>
                        <span className="flex-1">{error}</span>
                      </div>
                  )}
                  {success && (
                      <div className="bg-green-500/20 text-green-300 border border-green-500/50 rounded-lg p-3 text-sm flex items-start gap-2">
                        <span>✓</span>
                        <span className="flex-1">Success! Redirecting to login...</span>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="First Name" required className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0E6F6] transition" />
                    <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Last Name" required className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0E6F6] transition" />
                  </div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0E6F6] transition" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0E6F6] transition" />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0E6F6] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 text-white/70 hover:text-white" aria-label="Toggle password visibility">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <button type="submit" disabled={isLoading || success} className={`w-full py-3 mt-4 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg ${isLoading || success ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#E0E6F6] to-[#E0E6F6] text-black hover:shadow-purple-400/30'}`}>
                    {isLoading ? 'Creating Account...' : success ? 'Success!' : 'Create Account'}
                  </button>

                  <hr className="border-t-2 border-[#4D4D4D] !my-6" />

                  <div className="text-center">
                    <p>
                      Already have an account?{' '}
                      <Link to="/login" className="font-semibold hover:underline">Sign in</Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Register;