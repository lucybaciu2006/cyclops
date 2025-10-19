import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, ShieldCheck } from "lucide-react";
import { useProperty } from "@/contexts/property.context";
import { PhoneVerificationService } from "@/services/PhoneVerificationService";
import { PropertyService } from "@/services/PropertyService";
import { toast } from "sonner";

interface PhoneVerificationComponentProps {
    onClose: () => void;
    onVerified: (phoneNumber: string) => void;
}

export function PhoneVerificationComponent({ onClose, onVerified }: PhoneVerificationComponentProps) {
    const [phone, setPhone] = useState("");
    const [prefix, setPrefix] = useState("+40");
    const [smsSent, setSmsSent] = useState(false);
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { selectedProperty } = useProperty();

    const handleSendSMS = async () => {
        try {
            setIsLoading(true);
            await PhoneVerificationService.startPhoneVerification(prefix + phone);
            toast.success("SMS code sent successfully");
            setSmsSent(true);
        } catch (e) {
            toast.error("Failed to send SMS code");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        try {
            setIsLoading(true);
            const fullPhoneNumber = prefix + phone;
            await PropertyService.assignPhoneNumber(selectedProperty!._id, fullPhoneNumber, code);
            toast.success("Phone number verified and saved");
            onVerified(fullPhoneNumber);
        } catch (e: any) {
            console.error(e);
            setError("Invalid code or phone number");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Verify Phone Number</CardTitle>
                                <CardDescription>Link a phone number to your property</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        {/* Phone Number Input */}
                        <div className="grid gap-2">
                            <Label>New Phone Number</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{prefix}</span>
                                <Input
                                    placeholder="712 345 678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={smsSent}
                                />
                            </div>
                            {!smsSent && (
                                <Button onClick={handleSendSMS} disabled={isLoading || !phone}>
                                    {isLoading ? "Sending..." : "Send SMS Code"}
                                </Button>
                            )}
                        </div>

                        {/* Code Verification */}
                        {smsSent && (
                            <div className="grid gap-2">
                                <Label>Enter SMS Code</Label>
                                <Input
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button onClick={handleVerify} disabled={isLoading || !code}>
                                    {isLoading ? "Verifying..." : "Verify & Save"}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
