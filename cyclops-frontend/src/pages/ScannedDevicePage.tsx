import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {useNavigate, useParams} from "react-router-dom";
import {SportLocationService} from "@/services/SportLocationService.ts";
import {SportLocation} from "@/model/sport-location.ts";
import LoadingScreen from "@/components/layout/LoadingScreen.tsx";
import {AlertCircle, CheckCircle2, Mail, User} from "lucide-react";
import clsx from "clsx";
import {CreatePurchaseOrderRequest, PaymentService} from "@/services/PaymentService.ts";
import {RecordPurchaseType} from "@/model/record-purchase-type.ts";

type Plan = "video" | "video_highlight";

const ScannedDevicePage = () => {
    const { slang } = useParams<{ slang: string }>();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const navigate = useNavigate();
    const [property, setProperty] = useState<SportLocation | undefined>(undefined);
    const [propertyNotFound, setPropertyNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchLocation = async (s?: string) => {
        if (!s) {
            setPropertyNotFound(true);
            setLoading(false);
            return;
        }
        try {
            const response = await SportLocationService.getBySlug(s);
            setProperty(response);
            setPropertyNotFound(!response);
        } catch {
            setPropertyNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToPayment = async () => {
        const request: CreatePurchaseOrderRequest = {
            type: RecordPurchaseType.FULL_VIDEO_WITH_HIGHLIGHTS,
            email: 'lucy_baciu_2006@yahoo.com',
            durationMinutes: 90,
            locationId: property!._id,
            startTime: new Date().getTime(),
            userId: undefined
        };
        const po = await PaymentService.createPurchaseOrderAnonymously(request);
        navigate(`/purchase-order/${po._id}`);
    };

    useEffect(() => {
        setLoading(true);
        setSelectedPlan(null);
        fetchLocation(slang);
    }, [slang]);

    const handleNext = () => {
        if (!selectedPlan || !property) return;
        // TODO: Implement checkout logic (Stripe/etc.)
        // e.g. navigate(`/checkout?loc=${property.id}&plan=${selectedPlan}`)
        alert(
            `Proceeding with "${selectedPlan === "video" ? "Full Video" : "Full Video + Highlights"}" for ${property.name}`
        );
    };

    if (loading) return <LoadingScreen />;
    if (propertyNotFound) return <NotFoundResponse />;

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-100 flex flex-col items-center">
            <div className="max-w-3xl w-full">
                {/* Property Header */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <img
                        src={property?.image?.url || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1600&auto=format&fit=crop"}
                        alt={property?.name}
                        className="w-full h-56 object-cover"
                    />
                    <div className="p-6">
                        <h1 className="text-2xl font-bold">{property?.name}</h1>
                        <p className="text-sm text-muted-foreground">{property?.address}</p>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <PlanCard
                        title="Full Video"
                        desc="Get the full match recording in HD."
                        price="€5"
                        badges={["HD Quality"]}
                        selected={selectedPlan === "video"}
                        onSelect={() => setSelectedPlan("video")}
                    />

                    <PlanCard
                        title="Full Video + Highlights"
                        desc="Full match recording + automated highlights."
                        price="€8"
                        badges={["AI Highlights"]}
                        selected={selectedPlan === "video_highlight"}
                        onSelect={() => setSelectedPlan("video_highlight")}
                    />
                </div>

                {/* Footer / Next */}
                <div className="mt-6">
                    <Separator className="mb-4" />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {selectedPlan ? (
                                <>
                                    Selected:&nbsp;
                                    <span className="font-semibold text-primary">
                    {selectedPlan === "video" ? "Full Video" : "Full Video + Highlights"}
                  </span>
                                </>
                            ) : (
                                "Choose a plan to continue."
                            )}
                        </p>
                        <Button className="w-full sm:w-auto" disabled={!selectedPlan} onClick={handleNext}>
                            NEXT
                        </Button>
                    </div>
                </div>
                <AuthChoice/>
            </div>
            <Button className={clsx("w-full h-11 justify-start gap-3")} onClick={handleProceedToPayment}>
                <span className="flex-1 text-center">Proceed to checkout</span>
            </Button>
        </div>
    );
};

export default ScannedDevicePage;

/* ----------------------------- Helpers ------------------------------ */

type PlanCardProps = {
    title: string;
    desc: string;
    price: string;
    badges?: string[];
    selected?: boolean;
    onSelect: () => void;
};

const PlanCard = ({title, desc, price, badges = [], selected, onSelect}: PlanCardProps) => {
    return (
        <div>
            <Card
                role="button"
                tabIndex={0}
                onClick={onSelect}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
                className={clsx(
                    "transition-all cursor-pointer",
                    selected
                        ? "ring-2 ring-primary shadow-lg scale-[1.01]"
                        : "hover:shadow-md hover:scale-[1.01]"
                )}
            >
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{desc}</CardDescription>
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0"/>}
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-2">{price}</div>
                    <div className="flex flex-wrap gap-2">
                        {badges.map((b) => (
                            <Badge key={b} variant="secondary">
                                {b}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <span className="text-xs text-muted-foreground">Tap to select</span>
                </CardFooter>
            </Card>
        </div>
    );
};

const NotFoundResponse = () => {
    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-100 flex items-center justify-center">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <CardTitle>Sorry, QR or property not found</CardTitle>
                    <CardDescription>
                        The code you scanned doesn’t match any sport location. Please try again or contact support.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const AuthChoice = () => {

    return (
        <div className="bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Title</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Google */}
                    <Button
                        variant="outline"
                        className={clsx("w-full h-11 justify-start gap-3")}
                        // onClick={() => handleSelect("google")}
                        // disabled={loading || !!pending}
                    >
                        <span className="flex-1 text-center">Continue with Google</span>
                    </Button>

                    {/* Facebook */}
                    <Button
                        variant="outline"
                        className={clsx("w-full h-11 justify-start gap-3")}
                    >
                        <span className="flex-1 text-center">Continue with Facebook</span>
                    </Button>

                    {/* Email */}
                    <Button
                        className={clsx("w-full h-11 justify-start gap-3")}
                    >
                        <Mail className="h-5 w-5" />
                        <span className="flex-1 text-center">Continue with Email</span>
                    </Button>

                    <Separator className="my-4" />

                    {/* Guest */}
                    <Button
                        variant="ghost"
                        className="w-full h-11 justify-center"
                    >
                        <User className="h-5 w-5 mr-2" />
                        Continue without an account
                    </Button>

                    {/* small note */}
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        By continuing, you agree to our Terms & Privacy Policy.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}