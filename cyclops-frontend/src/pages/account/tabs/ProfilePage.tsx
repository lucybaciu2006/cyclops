import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {User} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {useAuth} from "@/contexts/auth.context.tsx";
import {useRef, useState} from "react";
import {AuthService} from "@/lib/auth.service.ts";
import {toast} from "sonner";
import { useLanguage } from '@/contexts/language.context.tsx';

const ProfilePage = () => {
    const { t } = useLanguage();
    const { principal, logout } = useAuth();
    const passwordFormRef = useRef<HTMLFormElement>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    // Initialize user state with actual user data
    const [user, setUser] = useState({
        name: principal?.name || "",
        email: principal?.email || "",
        company: "", // Company is not part of the User model
        avatar: "", // Avatar is not part of the User model
        phone: "" // Phone is not part of the User model
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await AuthService.updateProfile(user.email, user.name, user.company);
            toast.success(t('auth.profileUpdated'));
        } catch (error) {
            toast.error(t('profile.failedToUpdate'));
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!deletePassword.trim()) {
            toast.error(t('profile.enterPasswordError'));
            return;
        }

        try {
            await AuthService.deleteAccount(user.email, deletePassword);
            toast.success(t('profile.accountDeleted'));
            setIsDeleteDialogOpen(false);
            setDeletePassword("");
            // Logout after successful deletion
            setTimeout(() => {
                logout();
            }, 1000);
        } catch (err: any) {
            if (err?.message === "Invalid credentials") {
                toast.error(t('profile.invalidPassword'));
            } else {
                toast.error(t('profile.failedToDelete'));
            }
        }
    };

    return <div className="gap-6">
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.information')}</CardTitle>
                    <CardDescription>
                        {t('profile.updateInfo')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('profile.fullName')}</Label>
                                <Input
                                    id="name"
                                    value={user.name}
                                    onChange={(e) => setUser({...user, name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('profile.emailAddress')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user.email}
                                    disabled
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">{t('profile.company')}</Label>
                                <Input
                                    id="company"
                                    value={user.company}
                                    onChange={(e) => setUser({...user, company: e.target.value})}
                                />
                            </div>

                        </div>

                        <Button type="submit">
                            {t('profile.save')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.deleteAccount')}</CardTitle>
                    <CardDescription>
                        {t('profile.deleteDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('profile.deleteWarning')}
                    </p>
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                {t('profile.deleteAccount')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('profile.deleteAccount')}</DialogTitle>
                                <DialogDescription>
                                    {t('profile.deleteConfirm')}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="delete-password">{t('profile.enterPassword')}</Label>
                                    <Input
                                        id="delete-password"
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder={t('profile.passwordPlaceholder')}
                                        required
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsDeleteDialogOpen(false);
                                            setDeletePassword("");
                                        }}
                                    >
                                        {t('profile.cancel')}
                                    </Button>
                                    <Button type="submit" variant="destructive">
                                        {t('profile.deleteAccount')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    </div>
}

export default ProfilePage;