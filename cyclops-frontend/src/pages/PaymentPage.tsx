import React, { useEffect, useMemo, useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, AddressElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {CreatePurchaseOrderRequest, PaymentService, ReserveRequest} from "@/services/PaymentService.ts";
import { RecordPurchaseType } from "@/model/record-purchase-type";
import {useParams} from "react-router-dom";
import {ConfigFile} from "@/config-file.ts";
import {PurchaseOrder} from "@/model/purchase-order.ts";

const stripePromise = loadStripe(ConfigFile.STRIPE_PUBLIC_KEY);

const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "RON" });
const deriveDisplayAmount = (type: RecordPurchaseType) => (type === "FULL_VIDEO" ? 99_00 : 39_00);

function PaymentForm({
                         request,
                         paymentIntentId,
                     }: {
    request: CreatePurchaseOrderRequest;
    paymentIntentId: string;
}) {
    const stripe = useStripe();
    const elements = useElements();

    const [email, setEmail] = useState(request.email || "");
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const onPay = async () => {
        if (!stripe || !elements || !paymentIntentId) return;
        setIsPaying(true);
        setError(null);
        setMessage(null);

        try {
            // 1) Reserve the slot briefly on the backend
            // const reserveBody: ReserveRequest = {
            //     paymentIntentId,
            //     userId: request.userId,
            //     locationId: request.locationId,
            //     startTime: request.startTime,
            //     durationMinutes: request.durationMinutes,
            // };
            // await PaymentService.reserve(reserveBody);

            // 2) Confirm the payment (handles 3DS if needed)
            const { error: stripeErr } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url:
                        typeof window !== "undefined"
                            ? window.location.origin + "/payment/success"
                            : undefined,
                    receipt_email: email || undefined,
                },
                redirect: "if_required",
            });

            if (stripeErr) {
                setError(stripeErr.message || "Payment failed");
            } else {
                setMessage("Payment processing… you’ll be redirected or confirmed shortly.");
            }
        } catch (e: any) {
            setError(e?.message || "Could not reserve the slot. Maybe it was just booked.");
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Payment details */}
                <Card className="lg:col-span-3 shadow-sm border-muted">
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Payment details</h2>
                            <p className="text-sm text-muted-foreground">Securely pay with Stripe. Cards and local methods supported.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email for receipt</Label>
                                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Card details</Label>
                                <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
                            </div>

                            <div className="space-y-2">
                                <Label>Billing address</Label>
                                <AddressElement options={{ mode: "billing", fields: { phone: "auto" } }} />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-600">
                                {error}
                            </motion.div>
                        )}
                        {message && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-green-600">
                                {message}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <Button className="w-full h-11 text-base" disabled={!stripe || !elements || isPaying} onClick={onPay}>
                                {isPaying ? "Processing…" : "Pay now"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Order summary */}
                <Card className="lg:col-span-2 shadow-sm border-muted">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Order summary</h2>
                        <Separator />
                        <div className="space-y-3 text-sm">
                            <Row label="Type" value={request.type === "FULL_VIDEO" ? "Full match video" : "Highlights"} />
                            <Row label="Location" value={request.locationId} />
                            <Row label="User" value={request.userId} />
                            <Row label="Start time" value={new Date(request.startTime).toLocaleString()} />
                            <Row label="Duration" value={`${request.durationMinutes} min`} />
                        </div>
                        <Separator />
                        <Totals type={request.type} />
                        <p className="text-xs text-muted-foreground">Taxes calculated by Stripe. You’ll receive a receipt by email.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right break-all">{value}</span>
        </div>
    );
}

function Totals({ type }: { type: RecordPurchaseType }) {
    const subtotal = deriveDisplayAmount(type);
    const vat = Math.round(subtotal * 0.19);
    const total = subtotal + vat;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt.format(subtotal / 100)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>VAT (19%)</span><span>{fmt.format(vat / 100)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{fmt.format(total / 100)}</span></div>
        </div>
    );
}

export default function PaymentPage() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { id } = useParams<{ id: string }>();
    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | undefined>(undefined);

    useEffect(() => {
        if (!id) {
            return;
        }
        PaymentService.getPurchaseOrder(id).then(data => setPurchaseOrder(data));
    }, [id]);

    // Create (or reuse) PI on page load
    useEffect(() => {
        if (!id) {
            return;
        }
        let mounted = true;
        (async () => {
            try {
                const { clientSecret, paymentIntentId } = await PaymentService.createPaymentIntent(id);
                if (!mounted) return;
                setClientSecret(clientSecret);
                setPaymentIntentId(paymentIntentId);
            } catch (e: any) {
                if (!mounted) return;
                setError(e.message || "Could not initialize payment");
            }
        })();
        return () => { mounted = false };
    }, [id]);

    const options: StripeElementsOptions | undefined = useMemo(
        () =>
            clientSecret
                ? {
                    clientSecret,
                    appearance: {
                        variables: {
                            colorPrimary: "hsl(var(--primary))",
                            colorBackground: "hsl(var(--background))",
                            colorText: "hsl(var(--foreground))",
                            colorDanger: "#ef4444",
                            fontFamily:
                                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
                            spacingUnit: "6px",
                            radius: "12px",
                        },
                        rules: {
                            ".Input": { borderRadius: "12px", minHeight: "44px" },
                            ".Tab, .Block": { borderRadius: "12px" },
                        },
                    },
                }
                : undefined,
        [clientSecret]
    );

    return (
        <div className="min-h-[100dvh] bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
                <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
                    Checkout
                </motion.h1>

                {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

                {!clientSecret || !paymentIntentId ? (
                    <Card className="p-8">
                        <div className="animate-pulse text-sm text-muted-foreground">Preparing secure payment…</div>
                    </Card>
                ) : (
                    <Elements stripe={stripePromise} options={options}>
                        {purchaseOrder &&
                            <PaymentForm request={purchaseOrder.request} paymentIntentId={paymentIntentId} />
                        }
                    </Elements>
                )}
            </div>
        </div>
    );
}
