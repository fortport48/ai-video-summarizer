import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, User, Tv, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, signup, addNotification } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (showForgot) {
      // Forgot Password flow
      if (!email) {
        addNotification('Please enter your email', 'error');
        setLoading(false);
        return;
      }
      addNotification('Reset password link sent (Mocked)', 'success');
      setShowForgot(false);
      setIsLogin(true);
      setLoading(false);
      return;
    }

    if (isLogin) {
      // Login flow
      const success = await login(username, password);
      if (success) {
        // Logged in
      }
    } else {
      // Signup flow
      if (password !== confirmPassword) {
        addNotification('Passwords do not match', 'error');
        setLoading(false);
        return;
      }
      const success = await signup(username, email, password);
      if (success) {
        setIsLogin(true);
        setPassword('');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-md w-full glass-card p-8 border border-slate-800/80 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
            <Tv className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-brand-400 bg-clip-text text-transparent">
            {showForgot ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 text-center">
            {showForgot
              ? 'Enter email to receive password reset link'
              : isLogin
              ? 'AI Video Summary & Highlight generator'
              : 'Sign up to begin video clipping pipelines'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username (Not for forgot password) */}
          {!showForgot && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="demouser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input pl-11"
                />
              </div>
            </div>
          )}

          {/* Email (Not for login) */}
          {(!isLogin || showForgot) && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-11"
                />
              </div>
            </div>
          )}

          {/* Password (Not for forgot password) */}
          {!showForgot && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Signup only) */}
          {!isLogin && !showForgot && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input pl-11"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn-primary py-3.5 mt-2 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
            ) : showForgot ? (
              'Send Reset Link'
            ) : isLogin ? (
              <>
                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Form Toggles */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          {showForgot ? (
            <button
              onClick={() => {
                setShowForgot(false);
                setIsLogin(true);
              }}
              className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back to Sign In
            </button>
          ) : (
            <p className="text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-brand-400 hover:text-brand-300 hover:underline transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
