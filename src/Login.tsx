import { useState, type FormEvent } from 'react';
import './Login.css';

type LoginProps = {
  onLogin: (email: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (email.toLowerCase() === 'demo@caseassist.in' && password === 'Demo@123') {
      onLogin(email);
      return;
    }

    setError(
      'Authentication is not connected yet. Use the demo account below to preview CaseAssist.',
    );
  }

  return (
    <main className="login-screen">
      <section className="login-brand">
        <div className="login-brand-icon">✚</div>
        <h1>CaseAssist</h1>
        <p>Smart Patient Information &amp; Case Management</p>
        <div className="login-message">
          <h2>Better organised care starts here.</h2>
          <p>One workspace for patient case records, review workflows and healthcare insights.</p>
          <div className="login-feature">✓ &nbsp; Organised case management</div>
          <div className="login-feature">✓ &nbsp; Patient workflow tracking</div>
          <div className="login-feature">✓ &nbsp; Healthcare analytics</div>
        </div>
        <small>Indian healthcare workflow · Student project prototype</small>
      </section>

      <section className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <div className="login-eyebrow">WELCOME TO CASEASSIST</div>
          <h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
          <p className="login-muted">
            {mode === 'login'
              ? 'Enter your details to access the dashboard.'
              : 'Create an account to preview the sign-up interface.'}
          </p>

          {mode === 'signup' && (
            <label className="login-field">
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required />
            </label>
          )}

          <label className="login-field">
            Email address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>

          <label className="login-field">
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" type="submit">
            {mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          <div className="login-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <div className="demo-credentials">
            <strong>Demo account</strong>
            <p>Email: demo@caseassist.in</p>
            <p>Password: Demo@123</p>
            <button type="button" onClick={() => { setEmail('demo@caseassist.in'); setPassword('Demo@123'); setError(''); }}>
              Use Demo Credentials
            </button>
          </div>

          <p className="login-disclaimer">
            Prototype only. Sign-up does not create a real account until authentication is connected.
          </p>
        </form>
      </section>
    </main>
  );
}