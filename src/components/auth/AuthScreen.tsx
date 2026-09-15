import { useState } from 'react';
import type { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify';
interface AuthScreenProps { onLogin: (email: string) => void; onGoogleLogin: () => void; onSignup: (name: string, email: string, role: UserRole, company: string) => void; verificationRequired?: boolean; onVerify?: () => void; }

export function AuthScreen({ onLogin, onGoogleLogin, onSignup, verificationRequired = false, onVerify }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(verificationRequired ? 'verify' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('agency');
  const [message, setMessage] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login') onLogin(email);
    if (mode === 'signup') onSignup(name, email, role, company);
    if (mode === 'forgot') { setMessage('Reset instructions sent. Check your inbox.'); setMode('reset'); }
    if (mode === 'reset') { setMessage('Password updated. You can now log in.'); setMode('login'); }
  };
  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Build your insights workspace' : mode === 'forgot' ? 'Forgot your password?' : mode === 'reset' ? 'Create a new password' : 'Verify your email';
  return <main className="auth-shell"><section className="auth-aside"><div className="brand auth-brand"><span className="brand-mark">M</span><span>marketing insights</span></div><div className="auth-story"><p className="eyebrow">One clear view of growth</p><h1>Make every marketing decision easier to explain.</h1><p>Bring traffic, conversions, and client reporting into one calm workspace.</p><div className="auth-proof"><strong>184,290</strong><span>organic sessions tracked this week</span></div></div></section><section className="auth-panel"><div className="auth-card"><div className="auth-card-heading"><p className="eyebrow">Marketing insights</p><h2>{title}</h2><p className="muted">{mode === 'login' && 'Sign in to your workspace.'}{mode === 'signup' && 'Set up your account in under a minute.'}{mode === 'forgot' && 'We will send a secure reset link.'}{mode === 'reset' && 'Choose a password you will remember.'}{mode === 'verify' && 'One last step before you get started.'}</p></div>{message && <div className="auth-message">{message}</div>}{mode === 'verify' ? <div className="verify-box"><div className="verify-icon">@</div><p>We sent a verification link to <strong>{email || 'your new email address'}</strong>.</p><Button type="button" onClick={onVerify}>I have verified my email</Button><button className="text-button" onClick={() => setMessage('A new verification email has been sent.')}>Resend email</button></div> : <form onSubmit={submit} className="auth-form">{mode === 'signup' && <Input required placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} />}{(mode === 'login' || mode === 'signup' || mode === 'forgot') && <Input required type="email" placeholder="Work email" value={email} onChange={(event) => setEmail(event.target.value)} />}{mode === 'signup' && <><Input required placeholder="Company or agency" value={company} onChange={(event) => setCompany(event.target.value)} /><div className="role-switch"><button type="button" className={role === 'agency' ? 'selected' : ''} onClick={() => setRole('agency')}><strong>Freelancer / Agency</strong><span>Manage clients and reports</span></button><button type="button" className={role === 'client' ? 'selected' : ''} onClick={() => setRole('client')}><strong>Client</strong><span>View your marketing data</span></button></div></>}{(mode === 'login' || mode === 'reset') && <Input required type="password" minLength={6} placeholder={mode === 'reset' ? 'New password' : 'Password'} />}{mode === 'reset' && <Input required type="password" minLength={6} placeholder="Confirm password" />}<Button type="submit">{mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}</Button></form>}{mode === 'login' && <><div className="auth-divider"><span>or</span></div><Button variant="secondary" type="button" onClick={onGoogleLogin}>Continue with Google</Button><button className="link-button" onClick={() => setMode('forgot')}>Forgot password?</button></>}{mode === 'login' ? <p className="auth-switch">New to marketing insights? <button onClick={() => setMode('signup')}>Create an account</button></p> : mode !== 'verify' && <p className="auth-switch">Already have an account? <button onClick={() => setMode('login')}>Log in</button></p>}</div></section></main>;
}
