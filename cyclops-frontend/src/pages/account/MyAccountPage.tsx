import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import ProfilePage from "@/pages/account/tabs/ProfilePage.tsx";
import SubscriptionsPage from "@/pages/account/tabs/SubscriptionsPage.tsx";
import PaymentsPage from "@/pages/account/tabs/PaymentsPage.tsx";
import ChangePasswordTab from "@/pages/account/tabs/ChangePasswordTab.tsx";
import {ArrowLeft} from "lucide-react";
import {useLanguage} from "@/contexts/language.context.tsx";
// ... other imports

const allowedTabs = ['profile', 'password', 'subscriptions', 'payments', 'notifications'];
const defaultTab = 'profile';

const tabClass = "px-8 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none py-2";

const MyAccountPage = () => {
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(tab && allowedTabs.includes(tab) ? tab : defaultTab);
    console.log('my account page');
    useEffect(() => {
        if (!tab || !allowedTabs.includes(tab)) {
            navigate(`/my-account/${defaultTab}`, { replace: true });
        } else if (tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        navigate(`/my-account/${newTab}`);
    };

    return (
        <div className="mt-2 mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-800 mb-6">
                {t('common.properties')}
            </h1>
            {/* Header */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-transparent w-full p-0 border-b border-border flex justify-start">
                    <TabsTrigger value="profile" className={tabClass}>Profile</TabsTrigger>
                    <TabsTrigger value="password" className={tabClass}>Password</TabsTrigger>
                    <TabsTrigger value="subscriptions" className={tabClass}>Subscriptions</TabsTrigger>
                    <TabsTrigger value="payments" className={tabClass}>Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="profile"><ProfilePage/></TabsContent>
                <TabsContent value="password"><ChangePasswordTab/></TabsContent>
                <TabsContent value="subscriptions"><SubscriptionsPage/></TabsContent>
                <TabsContent value="payments"><PaymentsPage/></TabsContent>
            </Tabs>
        </div>
    );
};

export default MyAccountPage;