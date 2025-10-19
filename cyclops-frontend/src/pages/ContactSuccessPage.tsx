import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ContactSuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="py-8 min-h-[60vh] md:min-h-unset flex flex-grow items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white shadow-md rounded-2xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">Thank you!</h1>
                <p className="text-gray-600 mb-6">
                    Your message has been received. We'll get back to you as soon as possible.
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                    Back to Home
                </Button>
            </div>
        </div>
    );
};

export default ContactSuccessPage;
