import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Ticket, Phone, X } from "lucide-react";
import {toast} from "sonner";
import {Property} from "@/model/property.ts";
import {PropertyService} from "@/services/PropertyService.ts";
import {ServerError} from "@/core/server-error.ts";
import {Constants} from "@/core/constants.ts";
import {useLanguage} from "@/contexts/language.context.tsx";

interface ActivatePropertyComponentProps {
    property: Property;
    onClose: () => void;
    onActivate: (method: 'card' | 'code', data?: string) => void;
}

export function ActivatePropertyComponent({ property, onClose, onActivate }: ActivatePropertyComponentProps) {
    const [invitationCode, setInvitationCode] = useState('');
    const [invitationError, setInvitationError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { t } = useLanguage();


    const handleCardPayment = async () => {
        try {
            setIsLoading(true);
            const { url } = await PropertyService.createPaymentSession(property._id);
            if (url) window.location.href = url;
        } catch (err: any) {
            toast.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvitationSubmit = async () => {
        setInvitationError('');
        try {
            setIsLoading(true);
            await PropertyService.activatePropertyWithInvitation(property._id, invitationCode);
            toast.success(t('activation.invitationSuccess'));
        } catch (err: ServerError) {
            if (err.status === Constants.BUSINESS_ERROR) {
                setInvitationError(t(err.code));
            }

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
                                <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Activate Property</CardTitle>
                                <CardDescription>{property.name}</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Choose your activation method to start using your AI phone assistant
                        </p>
                    </div>

                    {/* Card Payment Option */}
                    <div className="space-y-4">
                        <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                                        <CreditCard className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">Credit Card Payment</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Start your subscription for AI phone assistance
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-2xl font-bold">$29</span>
                                                <span className="text-muted-foreground">/month</span>
                                            </div>
                                            <Button
                                                onClick={handleCardPayment}
                                                disabled={isLoading}
                                                className="ml-auto"
                                            >
                                                {isLoading ? 'Processing...' : 'Subscribe Now'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        {/* Invitation Code Option */}
                        <Card className="border-2">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center mt-1">
                                        <Ticket className="w-4 h-4 text-warning" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="font-semibold">Invitation Code</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Have a promo code or invitation? Enter it here
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="code">Invitation Code</Label>
                                            <Input
                                                id="code"
                                                placeholder="INVITE-CODE-2025"
                                                className={invitationError ? 'border-red-500' : ''}
                                                value={invitationCode}
                                                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                                            />
                                            {invitationError && (
                                                <p className="text-sm text-red-500 mt-0">{invitationError}</p>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleInvitationSubmit}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Activate with Code
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Once activated, you'll receive a dedicated phone number for your property
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}