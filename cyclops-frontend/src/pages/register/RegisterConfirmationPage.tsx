import { useSearchParams, Link } from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";

const RegisterConfirmationPage = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email");

    return (
        <div className="min-h-screen flex relative">
            <div className="absolute top-6 left-6 z-10">
                <Link to="/">
                    <img src="/logo.svg" alt="Logo" className="h-8 sm:h-10 cursor-pointer" />
                </Link>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-12">

                <div className="max-w-md w-full mx-auto space-y-8 text-center">

                    <div className="flex justify-center opacity-90 h-[160px]">
                        <img src="/mail-confirmation.png" alt="Mail Confirmation"/>
                    </div>

                    <h1 className="text-2xl font-bold">Email Confirmation</h1>
                    <p className="text-gray-600">
                        We’ve sent a confirmation email to <strong>{email || "your address"}</strong>.<br/>
                        Please check your inbox and click the link to confirm your email address.
                    </p>

                    <p className="text-sm text-gray-500 pt-4">
                        Didn’t get the email?{" "}
                        <button className="text-blue-600 cursor-pointer hover:underline">
                            Resend confirmation mail
                        </button>
                    </p>

                    {/* ✅ Go to login link */}
                    <p className="text-sm text-gray-500">
                        <Button className="btn-primary" variant="default" asChild>
                            <Link to="/login">Mergi la Login</Link>
                        </Button>
                    </p>
                </div>
            </div>

            <div className="hidden lg:block lg:w-1/2">
                <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    <img
                        src="/keylocker.png"
                        alt="Side image"
                        className="w-full h-full object-cover contrast-50 absolute inset-0"
                    />
                </div>
            </div>
        </div>
    );
};

export default RegisterConfirmationPage;
