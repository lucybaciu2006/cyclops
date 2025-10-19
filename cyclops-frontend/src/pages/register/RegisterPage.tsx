import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "@/lib/auth.service";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language.context";
import FacebookButton from "@/pages/login/FacebookButton";
import GoogleButton from "@/pages/login/GoogleButton";

const RegisterPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const formSchema = z
        .object({
            name: z.string().min(2, t('form.validation.minLength').replace('{min}', '2')),
            email: z.string().email(t('form.validation.email')),
            password: z.string().min(6, t('form.validation.minLength').replace('{min}', '6')),
            confirmPassword: z.string().min(6, t('form.validation.minLength').replace('{min}', '6')),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('auth.passwordsDoNotMatch'),
            path: ["confirmPassword"],
        });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const { confirmPassword, ...registrationData } = values;
            await AuthService.register(registrationData);
            navigate(`/register/confirm?email=${encodeURIComponent(values.email)}`);
        } catch (error: any) {
            if (error?.code === "EMAIL_ALREADY_REGISTERED") {
                form.setError("email", {
                    type: "manual",
                    message: "Acest email este deja înregistrat",
                });
            } else {
                const userFriendlyMessage = t("auth.registerError");
                toast.error(userFriendlyMessage);
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left (Form + Logo) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 lg:px-12 py-12">
                {/* Logo */}
                <div className="w-full flex justify-center bg-gray-100 md:bg-transparent py-6">
                    <Link to="/" className="max-w-[80%]">
                        <img src="/logo.svg" alt="Logo" className="h-8 w-auto max-w-full" />
                    </Link>
                </div>

                {/* Form Container */}
                <div className="max-w-md w-full mt-[2vh]">
                    <div className="space-y-2 text-center my-4">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {t('landing.createAccount')}
                        </h1>
                        <p className="text-gray-500">{t('landing.register')}</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-4">
                        <FacebookButton
                            label={"Login with Facebook"}
                            handleFacebookSuccess={() => {}}
                        />
                        <GoogleButton onSuccess={() => {}} />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-muted-foreground">Sau continuă cu email</span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.fullName')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nume Prenume" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full btn-primary text-white" size="lg">
                                    Creează cont
                                </Button>
                            </form>
                        </Form>

                        <p className="text-center text-sm text-gray-600">
                            {t('landing.alreadyHaveAccount')}{" "}
                            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                                {t('landing.signIn')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right (Image) - Only on Desktop */}
            <div className="hidden lg:block lg:w-1/2">
                <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    <img
                        src="/keylocker.png"
                        alt="Modern apartment interior"
                        className="w-full h-full object-cover contrast-50 absolute inset-0"
                    />
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
