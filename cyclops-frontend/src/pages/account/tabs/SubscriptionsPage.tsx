import {useEffect, useState} from "react";
import {PaymentService} from "@/services/PaymentService.ts";
import {UserSubscription} from "@/model/user-subscription.ts";
import {Badge} from "@/components/ui/badge.tsx";
import {Skeleton} from "@/components/ui/skeleton.tsx";
import {toast} from "sonner";
import {format} from "date-fns";

const SubscriptionPage = () => {
    const [subscriptions, setSubscriptions] = useState<UserSubscription[] | undefined>(undefined);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const data = await PaymentService.getUserSubscriptions();
                setSubscriptions(data);
            } catch (error) {
                toast.error("Failed to load subscriptions");
                setSubscriptions([]);
            }
        };

        fetchSubscriptions();
    }, []);

    const formatDate = (timestamp?: number) =>
        timestamp ? format(new Date(timestamp), "dd MMM yyyy") : "N/A";

    return (
        <div className="space-y-6">
            {subscriptions?.length === 0 && (
                <div className="text-sm text-muted-foreground py-4">
                    Nu există subscrieri active în acest moment.
                </div>
            )}

            {subscriptions?.length > 0 &&
                <div className="w-full">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div>ID</div>
                        <div>Proprietate</div>
                        <div>Status</div>
                        <div>Început</div>
                        <div>Valid până</div>
                        <div>Următoarea facturare</div>
                    </div>

                    {subscriptions === undefined &&
                        Array.from({length: 4}).map((_, idx) => (
                            <div key={idx} className="grid grid-cols-6 gap-4 py-2">
                                <Skeleton className="h-4 w-full"/>
                                <Skeleton className="h-4 w-full"/>
                                <Skeleton className="h-4 w-16"/>
                                <Skeleton className="h-4 w-20"/>
                                <Skeleton className="h-4 w-20"/>
                                <Skeleton className="h-4 w-24"/>
                            </div>
                        ))}

                    {subscriptions?.map((sub) => (
                        <div key={sub.stripeSubscriptionId} className="grid grid-cols-6 gap-4 py-2 text-sm">
                            <div className="truncate">{sub.stripeSubscriptionId}</div>
                            <div className="truncate">{sub.propertyId}</div>
                            <div>
                                <Badge variant={
                                    sub.status === "active"
                                        ? "default"
                                        : sub.status === "past_due"
                                            ? "destructive"
                                            : "secondary"
                                }>
                                    {sub.status}
                                </Badge>
                            </div>
                            <div>{formatDate(sub.startedAt)}</div>
                            <div>{formatDate(sub.validUntil)}</div>
                            <div>{formatDate(sub.nextBillingDate)}</div>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
};

export default SubscriptionPage;
