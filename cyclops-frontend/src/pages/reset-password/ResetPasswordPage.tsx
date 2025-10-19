import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthService } from '@/lib/auth.service';
import { useLanguage } from '@/contexts/language.context';
import LanguageSelector from '@/components/LanguageSelector';

const ResetPasswordPage = () => {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isVerifying, setIsVerifying] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resetPassword = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setError('Sorry, the link is invalid or expired');
                setIsVerifying(false);
                return;
            }
            setToken(token);
        };

        resetPassword();
    }, [searchParams, navigate]);

    const validatePassword = (password: string): boolean => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const newPassword = formData.get('new-password') as string;
        const confirmPassword = formData.get('confirm-password') as string;

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            toast.error(t('auth.passwordsDoNotMatch'));
            return;
        }

        // Validate password strength
        if (!validatePassword(newPassword)) {
            toast.error(t('form.validation.passwordStrength'));
            return;
        }

        try {
            await AuthService.resetPassword(token!, newPassword);
            toast.success(t('auth.passwordUpdated'));
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        } catch (err) {
            setError('Sorry, the link is invalid or expired');
            toast.error(t('auth.passwordResetFailed'));
        } finally {
            setIsVerifying(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
            {/* Language selector in top right */}
            <div className="absolute top-6 right-6 z-10">
                <LanguageSelector />
            </div>

            {/* Logo in top left */}
            <div className="absolute top-6 left-6 z-10">
                <Link to="/">
                    <img src="/logo.svg" alt="Logo" className="h-8 sm:h-10 cursor-pointer" />
                </Link>
            </div>

            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t('auth.resetPassword')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your new password and confirm it.
                    </p>
                </div>
                <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
                        <Input
                            id="new-password"
                            name="new-password"
                            type="password"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('form.validation.passwordStrength')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                        <Input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        {t('common.save')}
                    </Button>

                    <div className="text-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
                            {t('common.back')} to {t('auth.login')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;