import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="header bg-gray-900 text-white px-3 h-14 flex items-center justify-between shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="header-left flex items-center gap-3">
          <div className="app-menu w-5 h-5 grid grid-cols-3 gap-px">
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-gray-600'}`}
              ></div>
            ))}
          </div>
        </div>
        <div className="header-right flex items-center gap-2">
          <div className="user-info flex items-center gap-1.5">
            <div className="user-avatar w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
              AC
            </div>
            <div>
              <div className="text-sm font-semibold">Accountant</div>
              <div className="text-xs text-gray-400">Register</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar - hidden on mobile */}
        <aside className="sidebar w-60 bg-white border-r border-border fixed top-14 bottom-0 left-0 overflow-y-auto py-4 hidden md:block">
          <div className="sidebar-section mb-6">
            <Link to="/" className="sidebar-item flex items-center px-4 py-2.5 text-gray-600 text-sm no-underline border-l-3 border-transparent transition-all duration-200 hover:bg-gray-100">
              <div className="sidebar-item-icon w-4 h-4 mr-2.5 flex items-center justify-center">🏠</div>
              Home
            </Link>
          </div>
          <div className="sidebar-section mb-6">
            <div className="sidebar-header flex items-center justify-between px-4 mb-2">
              <div className="sidebar-title text-sm font-semibold text-gray-800">Authentication</div>
            </div>
            <Link to="/login" className="sidebar-item flex items-center px-4 py-2.5 text-gray-600 text-sm no-underline border-l-3 border-transparent transition-all duration-200 hover:bg-gray-100">
              <div className="sidebar-item-icon w-4 h-4 mr-2.5 flex items-center justify-center">🔑</div>
              Login
            </Link>
            <a href="#" className="sidebar-item flex items-center px-4 py-2.5 text-gray-800 text-sm no-underline border-l-3 border-blue-500 bg-gray-100 transition-all duration-200">
              <div className="sidebar-item-icon w-4 h-4 mr-2.5 flex items-center justify-center">📝</div>
              Register
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-1 ml-0 md:ml-60 p-4 md:p-6">
          <div className="page-header mb-6">
            <h1 className="page-title text-2xl md:text-3xl font-bold text-gray-800 mb-1.5">Register</h1>
            <p className="page-subtitle text-sm md:text-base text-gray-500">Create a new account</p>
          </div>

          <div className="register-section max-w-md mx-auto bg-card border border-border rounded-lg p-5 md:p-6 shadow-sm">
            {error && (
              <div className="error-message bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-2.5 mb-4 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message bg-success/10 text-success border border-success/20 rounded-md p-2.5 mb-4 text-sm">
                Registration successful! Redirecting to login...
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="register-form flex flex-col gap-4">
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="name" className="label text-xs md:text-sm font-medium text-gray-600">First Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full px-3 py-2.5 text-sm md:text-base border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="surname" className="label text-xs md:text-sm font-medium text-gray-600">Last Name</label>
                <input
                  type="text"
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="input w-full px-3 py-2.5 text-sm md:text-base border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="username" className="label text-xs md:text-sm font-medium text-gray-600">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full px-3 py-2.5 text-sm md:text-base border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  placeholder="Enter your username"
                />
              </div>
              
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="email" className="label text-xs md:text-sm font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full px-3 py-2.5 text-sm md:text-base border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="password" className="label text-xs md:text-sm font-medium text-gray-600">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full px-3 py-2.5 text-sm md:text-base border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || success}
                className={`register-button w-full py-2.5 px-5 text-sm md:text-base font-medium text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  isLoading || success
                    ? 'bg-primary/70 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90 cursor-pointer'
                }`}
              >
                {isLoading ? 'Registering...' : success ? 'Registered!' : 'Register'}
              </button>
              
              <div className="login-link text-center mt-3 text-xs md:text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Register;
