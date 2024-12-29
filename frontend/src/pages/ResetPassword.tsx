import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundLines } from "../components/aceturnity/background-beams";
import { Button } from "../components/shadcn/button";
import { Input } from "../components/shadcn/input";
import { Label } from "../components/shadcn/label";
import { useAuth } from '../contexts/AuthenticationProvider';

export const ResetPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        resetPassword(email, 
            () => {
                setMessage("Password reset email sent. Please check your inbox.");
                setTimeout(() => navigate('/authentication?mode=login'), 5000);
            },
            (error) => setError(error.message)
        );
    };

    return (
        <div className="w-[100vw] h-[100vh] lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <form onSubmit={handleSubmit} className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold dark:text-white">Reset Password</h1>
                        <p className="text-balance text-muted-foreground dark:text-gray-300">
                            Enter your email address and we&apos;ll send you a link to reset your password.
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
                        <Button type="submit" className="w-full dark:text-white">
                            Send Reset Link
                        </Button>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {message && <p className="text-green-500 text-sm">{message}</p>}
                    </div>
                    <div className="mt-4 text-center text-sm dark:text-gray-300">
                        Remember your password? {' '}
                        <a href="/authentication?mode=login" className="underline">
                            Login
                        </a>
                    </div>
                </form>
            </div>
            <div className="relative hidden bg-red-500 lg:block">
                <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 bg-muted">
                    <h2 className="max-w-2xl bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
                        Missing something?
                    </h2>
                    <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-300 text-center">
                        Forgetting your password is no big deal... Just don&apos;t do it again.
                    </p>
                </BackgroundLines>
            </div>
        </div>
    );
};