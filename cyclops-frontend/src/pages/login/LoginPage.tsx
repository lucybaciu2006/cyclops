import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {FaFacebook} from "react-icons/fa";
import {FcGoogle} from "react-icons/fc";
import {Link, useNavigate} from "react-router-dom";
import {toast} from "sonner";
import {useState} from "react";
import {useAuth} from "@/contexts/auth.context";
import { useLanguage } from "@/contexts/language.context";
import LanguageSelector from "@/components/LanguageSelector";
import FacebookButton from "@/pages/login/FacebookButton.tsx";
import GoogleButton from "@/pages/login/GoogleButton.tsx";
import {AuthService} from "@/lib/auth.service.ts";
import {LoginResponse} from "@/model/login-response.ts";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, oAuthLogin } = useAuth();
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
    const { t } = useLanguage();

    const formSchema = z.object({
        email: z.string().email(t('form.validation.email')),
        password: z.string().min(6, t('form.validation.minLength').replace('{min}', '6')),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const loginWithProvider = async (provider: 'google' | 'facebook', token: string) => {
        await oAuthLogin({provider, token});
        navigate('/properties');
    }

    const handleLoginWithFacebook = (token: string) => {
        loginWithProvider('facebook', token);
    }

    const handleLoginWithGoogle = (token: string) => {
        loginWithProvider('google', token);
    }


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setUnconfirmedEmail(null);
        try {
            const response = await login(values).then(() => console.log('Login successful:'));
            console.log('all good');
            navigate('/properties');
        } catch (error: any) {
            const errorCode = error?.code;
            console.log(error);
            if (errorCode === 'EMAIL_NOT_EXISTING') {
                form.setError('email', {
                    type: 'manual',
                    message: t('auth.emailNotExisting')
                });
            } else if (errorCode === 'EMAIL_NOT_CONFIRMED') {
                setUnconfirmedEmail(values.email);
                form.setError('email', {
                    type: 'manual',
                    // message: 'Adresa de email nu este confirmata'
                });
            } else if (errorCode === 'INVALID_CREDENTIALS') {
                form.setError('password', {
                    type: 'manual',
                    message: t('auth.invalidCredentials')
                });
            } else {
                const userFriendlyMessage = t('auth.loginError');
                toast.error(userFriendlyMessage);
            }
        }
    };

    const handleResendConfirmation = async (email: string) => {
        // try {
        //     await AuthService.resendConfirmation(email); // implement this on your backend
        //     toast.success('Emailul de confirmare a fost trimis din nou');
        // } catch (err) {
        //     toast.error('A apărut o eroare la trimiterea emailului');
        // }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left (Form + Logo) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 lg:px-12 py-12">
                {/* Logo */}
                <div className="w-full flex justify-center bg-gray-100 md:bg-transparent py-6">
                    <Link to="/" className="max-w-[80%]">
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="h-8 w-auto max-w-full"
                        />
                    </Link>
                </div>

                {/* Form Container */}
                <div className="max-w-md w-full mt-[5vh]">
                    <div className="space-y-2 text-center my-6">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {t('landing.welcome')}
                        </h1>
                        <p className="text-gray-500">
                            {t('landing.connect')}
                        </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-4">
                        <FacebookButton
                            label={'Login with Facebook'}
                            handleFacebookSuccess={handleLoginWithFacebook}
                        />
                        <GoogleButton onSuccess={handleLoginWithGoogle} />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-muted-foreground">
                Sau continuă cu email
              </span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.email')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="nume@exemplu.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            {unconfirmedEmail && (
                                                <div className="text-sm text-red-600 mt-1">
                                                    Nu ai confirmat adresa de email.{" "}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleResendConfirmation(unconfirmedEmail)
                                                        }
                                                        className="text-blue-600 underline hover:text-blue-700 ml-1"
                                                    >
                                                        Trimite din nou
                                                    </button>
                                                </div>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.password')}</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        {t('auth.forgotPassword')}
                                    </Link>
                                </div>

                                <Button type="submit" className="w-full btn-primary text-white" size="lg">
                                    {t('auth.login')} cu Email
                                </Button>
                            </form>
                        </Form>

                        <p className="text-center text-sm text-gray-600">
                            {t('landing.dontHaveAccount')}{" "}
                            <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                                {t('landing.signUp')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right (Image) - Only on Desktop */}
            <div className="hidden lg:block lg:w-1/2">
                <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    <img
                        src="public/keylocker.png"
                        alt="Modern apartment interior"
                        className="w-full h-full object-cover contrast-50 absolute inset-0"
                    />
                </div>
            </div>
        </div>
    );

};

export default LoginPage;
