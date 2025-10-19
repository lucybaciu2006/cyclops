import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { PaymentService } from "@/services/PaymentService.ts";
import { UserPayment } from "@/model/user-payment.ts";
import { Download } from "lucide-react";

const PaymentsPage = () => {
    const [payments, setPayments] = useState<UserPayment[] | undefined>(undefined);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const data = await PaymentService.getUserPayments();
                setPayments(data);
            } catch (err) {
                toast.error("Failed to load payments");
                setPayments([]);
            }
        };

        fetchPayments();
    }, []);

    const formatDate = (timestamp: number) =>
        timestamp ? format(new Date(timestamp), "dd MMM yyyy") : "N/A";

    const formatAmount = (amount: number, currency: string) =>
        `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;

    const handleDownloadInvoice = async (url: string) => {
        if (url) {
            window.open(url, "_blank");
        }
    };

    return (
        <div className="space-y-6">
            {/*<div>*/}
            {/*    <h2 className="text-xl font-semibold tracking-tight">Plăți</h2>*/}
            {/*    <p className="text-muted-foreground text-sm">*/}
            {/*        Istoricul plăților efectuate pentru subscrieri*/}
            {/*    </p>*/}
            {/*</div>*/}

            <div className="w-full">
                <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Ref</div>
                    <div>Proprietate</div>
                    <div>Sumă</div>
                    <div>Status</div>
                    <div>Plătit la</div>
                    <div>Factura</div>
                </div>

                {payments === undefined &&
                    Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="grid grid-cols-7 gap-4 py-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-10" />
                        </div>
                    ))}

                {payments?.length === 0 && (
                    <div className="text-sm text-muted-foreground py-4">
                        Nu ai plăți înregistrate.
                    </div>
                )}

                {payments?.map((payment) => (
                    <div
                        key={payment.stripeInvoiceId}
                        className="grid grid-cols-7 gap-4 py-2 text-sm items-center"
                    >
                        <div className="truncate">{payment.stripeInvoiceNumber}</div>
                        <div className="truncate">{payment.propertyName}</div>
                        <div>{formatAmount(payment.amount, payment.currency)}</div>
                        <div>
                            <Badge
                                variant={
                                    payment.status === "paid"
                                        ? "default"
                                        : payment.status === "refunded"
                                            ? "secondary"
                                            : "destructive"
                                }
                            >
                                {payment.status}
                            </Badge>
                        </div>
                        <div>{formatDate(payment.paidAt)}</div>
                        <div>
                            {payment.invoiceUrl &&
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadInvoice(payment.invoiceUrl)}
                                    title="Descarcă factura"
                                >
                                    <Download className="h-4 w-4"/>
                                </Button>
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentsPage;
