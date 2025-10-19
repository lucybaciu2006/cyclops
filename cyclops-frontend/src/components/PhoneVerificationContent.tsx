import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PropertyService } from '@/services/PropertyService.ts';
import { PhoneVerificationService } from '@/services/PhoneVerificationService.ts';
import { cn } from "@/lib/utils";
import {Property} from "@/model/property.ts";

interface PhoneVerificationContentProps {
    property: Property,
    onVerified: (fullPhoneNumber: string) => void;
    onCancel?: () => void;
    className?: string;
}

export default function PhoneVerificationContent({
                                                    property,
                                                     onVerified,
                                                     onCancel,
                                                     className,
                                                 }: PhoneVerificationContentProps) {
    const [phone, setPhone] = useState("");
    const [prefix] = useState("+40");
    const [code, setCode] = useState("");
    const [smsSent, setSmsSent] = useState(false);
    const [loading, setLoading] = useState(false);


    const fullPhoneNumber = prefix + phone;

    const handleSendSMS = async () => {
        try {
            setLoading(true);
            await PhoneVerificationService.startPhoneVerification(fullPhoneNumber);
            setSmsSent(true);
        } catch (error) {
            console.error("Failed to send SMS:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        try {
            setLoading(true);
            await PropertyService.assignPhoneNumber(property!._id, fullPhoneNumber, code);
            onVerified(fullPhoneNumber);
        } catch (error) {
            console.error("Verification failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            <img style={{height: 240, width: '100%', objectFit: 'contain'}} src="https://thumbs.dreamstime.com/b/check-mark-phone-icon-like-apply-now-confirm-flat-trend-modern-logotype-graphic-web-outline-design-element-isolated-351224788.jpg"/>
            <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Verify Phone Number</h2>
                <p className="text-sm text-muted-foreground">
                    Please confirm your phone number. You’ll receive a verification code via SMS.
                </p>
            </div>

            {/* Phone input */}
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {prefix}
                  </span>

                    <Input
                        id="phone"
                        placeholder="712 345 678"
                        value={phone}
                        disabled={smsSent}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-12" // Adjust this to fit your prefix length
                    />
                </div>
                {!smsSent && (
                    <Button
                        onClick={handleSendSMS}
                        className="w-full mt-2"
                        disabled={!phone.trim() || loading}
                    >
                        {loading ? "Sending..." : "Send SMS Code"}
                    </Button>
                )}
            </div>

            {/* SMS Code input */}
            {smsSent && (
                <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                        id="code"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <Button
                        onClick={handleVerify}
                        className="w-full mt-2"
                        disabled={!code.trim() || loading}
                    >
                        {loading ? "Verifying..." : "Verify & Save"}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleSendSMS}
                        disabled={loading}
                        className="text-xs text-muted-foreground"
                    >
                        Resend Code
                    </Button>
                </div>
            )}

            {onCancel && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            )}
        </div>
    );
}
