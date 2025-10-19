import {useLanguage} from "@/contexts/language.context.tsx";
import {useAuth} from "@/contexts/auth.context.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {toast} from "sonner";
import {AuthService} from "@/lib/auth.service.ts";
import {useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";

export default function ChangePasswordTab() {
    const {t} = useLanguage();
    const {principal, logout} = useAuth();
    const passwordFormRef = useRef<HTMLFormElement>(null);

    // Initialize user state with actual user data
    const [user, setUser] = useState({
        name: principal?.name || "",
        email: principal?.email || "",
        company: "", // Company is not part of the User model
        avatar: "", // Avatar is not part of the User model
        phone: "" // Phone is not part of the User model
    });

    const validatePassword = (password: string): boolean => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const currentPassword = formData.get('current-password') as string;
        const newPassword = formData.get('new-password') as string;
        const confirmPassword = formData.get('confirm-password') as string;



        // Validate passwords match
        if (newPassword !== confirmPassword) {
            toast.error(t('auth.passwordsDoNotMatch'));
            return;
        }

        // // Validate password strength
        // if (!validatePassword(newPassword)) {
        //     toast.error(t('form.validation.passwordStrength'));
        //     return;
        // }

        try {
            await AuthService.updatePassword(user.email, currentPassword, newPassword);
            toast.success(t('auth.passwordUpdated'));
            passwordFormRef.current?.reset();
        } catch (err: any) {
            if (err?.message === "Invalid credentials") {
                toast.error(t('auth.invalidCredentials'));
            } else {
                toast.error(t('auth.passwordResetFailed'));
            }
        }
    };

    return (
        <div className="w-full max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>{t('account.password')}</CardTitle>
                    <CardDescription>
                        {t('account.passwordDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={passwordFormRef} onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">{t('auth.currentPassword')}</Label>
                            <Input id="current-password" name="current-password" type="password"/>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
                            <Input id="new-password" name="new-password" type="password"/>
                            <p className="text-xs text-muted-foreground">
                                {t('form.validation.passwordStrength')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                            <Input id="confirm-password" name="confirm-password" type="password"/>
                        </div>

                        <Button type="submit" className="w-full">
                            {t('common.save')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}