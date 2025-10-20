import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Using the real AuthContext
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// A simple component for the top-left logo
const IdLogo = () => (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* SVG paths */}
    </svg>
);


const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Hooking into the actual login function from your context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Calling the real login function from the context
      await login(identifier, password);
      navigate('/notebooks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      // Main Container: Sets the positioning context and prevents overflow scrollbars
      <div className="relative min-h-screen w-full bg-[#0F0F0F] text-white font-noto-sans overflow-hidden">

        {/* Background Image Element */}
        <div
            className="absolute w-[2200px] h-[1680px] -left-[50px] top-[-120px] z-0"
            style={{
              backgroundImage: `url('/login_background.png')`, // Path from the public folder
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              transform: 'rotate(1deg)',
            }}
        ></div>

        {/* Content Container: Sits on top of the background with a higher z-index */}
        <div className="relative z-10 min-h-screen w-full grid md:grid-cols-2 bg-black/20 p-8 sm:p-12">

          {/* Left Section: Branding */}
          <div className="hidden md:flex flex-col justify-between py-8">
            <IdLogo />
            <div className="pl-4">
              <img src="/login_logo.png" alt="IDRE Logo" className="w-[561px] ml-[65px]" />
            </div>
            <div /> {/* Spacer div */}
          </div>

          {/* Right Section: Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div
                  className="bg-black/20 border border-white/20 rounded-2xl shadow-xl shadow-black/30 backdrop-blur-lg"
                  style={{ background: 'linear-gradient(321.23deg, rgba(191, 191, 191, 0.062) 5.98%, rgba(0, 0, 0, 0) 66.28%), rgba(0, 0, 0, 0.14)' }}
              >
                <form onSubmit={handleSubmit} className="p-12 space-y-6">

                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="font-montserrat-alt text-4xl font-semibold">Login</h2>
                    <p className="font-montserrat-alt text-white/80 mt-2">Welcome back!</p>
                  </div>

                  {/* Error Display: Styled for the new dark theme */}
                  {error && (
                      <div className="bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg p-3 text-sm flex items-start gap-2">
                        <span>⚠️</span>
                        <span className="flex-1">{error}</span>
                      </div>
                  )}

                  {/* Input Fields */}
                  <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Username or Email"
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />

                  <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 bg-transparent border border-white/80 rounded-xl placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 text-white/70 hover:text-white"
                        aria-label="Toggle password visibility"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex justify-between items-center text-sm font-medium">
                    <label className="flex items-center gap-2 cursor-pointer font-montserrat-alt text-white/90">
                      <input type="checkbox" className="form-checkbox bg-transparent border-white/80 text-[#9D3D9D] focus:ring-purple-400" />
                      Remember me
                    </label>
                    <Link to="/forgot-password" className="hover:underline text-white/90">Forgot password ?</Link>
                  </div>

                  {/* Login Button */}
                  <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg ${
                          isLoading
                              ? 'bg-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#E0E6F6] to-[#9D3D9D] text-black hover:shadow-purple-400/30'
                      }`}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>

                  <hr className="border-t-2 border-[#4D4D4D] my-6" />

                  {/* Signup & Footer Links */}
                  <div className="text-center space-y-6">
                    <p>
                      Don’t have an account ?{' '}
                      <Link to="/register" className="font-semibold hover:underline">Signup</Link>
                    </p>
                    <div className="flex justify-between items-center text-sm text-white/70">
                      <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
                      <Link to="/support" className="hover:underline">Support</Link>
                      <Link to="/care" className="hover:underline">Customer Care</Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Login;