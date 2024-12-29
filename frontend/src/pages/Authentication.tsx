import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BackgroundLines } from "../components/aceturnity/background-beams"
import { Button } from "../components/shadcn/button"
import { Input } from "../components/shadcn/input"
import { Label } from "../components/shadcn/label"
import { Checkbox } from "../components/shadcn/checkbox"
import { useAuth } from '../contexts/AuthenticationProvider';

export const Authentication: React.FC = () => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'login';
    const { login, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = () => {
      loginWithGoogle(
          () => navigate('/dashboard'),
          (error) => setError(error.message)
      );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'sign-up') {
            if (password !== confirmPassword) {
                setError("Passwords don't match");
                return;
            }
            register(email, password, name, 
                () => navigate('/dashboard'),
                (error) => setError(error.message)
            );
        } else {
            login(email, password, 
                () => navigate('/dashboard'),
                (error) => setError(error.message)
            );
        }
    };

    return (
      <div className="w-[100vw] h-[100vh] lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <form onSubmit={handleSubmit} className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold dark:text-white">{mode === 'sign-up' ? 'Sign Up' : 'Login'}</h1>
            <p className="text-balance text-muted-foreground dark:text-gray-300">
              {mode === 'sign-up' 
                ? 'Create an account to get started'
                : 'Enter your email below to login to your account'}
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="dark:text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className='dark:text-white'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode === 'sign-up' && (
              <div className="grid gap-2">
                <Label htmlFor="name" className="dark:text-white">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className='dark:text-white'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="dark:text-white">Password</Label>
                {mode === 'login' && (
                  <a
                    href="/reset-password"
                    className="ml-auto inline-block text-sm underline dark:text-gray-300"
                  >
                    Forgot your password?
                  </a>
                )}
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                className='dark:text-white'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === 'sign-up' && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="dark:text-white">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  required 
                  className='dark:text-white'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            {mode === 'sign-up' && (
              <div className="flex items-center space-x-2">
                <Checkbox id="privacy-policy" />
                <Label htmlFor="privacy-policy" className="text-sm dark:text-gray-300">
                  I agree to the <a href="/privacy-policy" className="underline">privacy policy</a>
                </Label>
              </div>
            )}
            <Button type="submit" className="w-full dark:text-white">
              {mode === 'sign-up' ? 'Sign Up' : 'Login'}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button 
              variant="outline" 
              className="w-full dark:text-white"
              onClick={handleGoogleSignIn}
            >
              {mode === 'sign-up' ? 'Sign Up' : 'Login'} with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm dark:text-gray-300">
            {mode === 'sign-up' 
              ? 'Already have an account? '
              : "Don't have an account? "}
            <a href={mode === 'sign-up' ? '/authentication?mode=login' : '/authentication?mode=sign-up'} className="underline">
              {mode === 'sign-up' ? 'Login' : 'Sign up'}
            </a>
          </div>
        </form>
      </div>
          <div className="relative hidden bg-red-500 lg:block">
            <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 bg-muted">
              <h2 className="max-w-2xl bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
                Your journey begins here
              </h2>
              <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-300 text-center">
                {mode === 'sign-up' 
                  ? 'Create an account to get started...'
                  : 'Welcome back! Login to continue...'}
              </p>
            </BackgroundLines>
          </div>
        </div>
    )
}