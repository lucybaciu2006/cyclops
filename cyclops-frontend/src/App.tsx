import {BrowserRouter as Router, Routes, Route, Navigate, Outlet} from 'react-router-dom';
import {AuthProvider, useAuth} from './contexts/auth.context';
import {LanguageProvider} from './contexts/language.context';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import ForgotPassword from './pages/forgot-password/ForgotPassword';
import {Toaster} from 'sonner';
import {EmailVerifyPage} from './pages/email-verify/EmailVerifyPage';
import RegisterConfirmationPage from "@/pages/register/RegisterConfirmationPage.tsx";
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import React, {Fragment} from "react";
import {Progress} from "@/components/ui/progress.tsx";
import LandingPage from "@/pages/landing-page/LandingPage.tsx";
import FAQPage from "@/pages/static/faq/FAQPage.tsx";
import HowItWorksPage from "@/pages/HowItWorksPage.tsx";
import SupportPage from "@/pages/SupportPage.tsx";
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage.tsx';
import LoadingScreen from '@/components/layout/LoadingScreen.tsx';
import {GoogleOAuthProvider} from "@react-oauth/google";
import {ConfigFile} from "@/config-file.ts";
import ContactPage from './pages/ContactPage.tsx';
import MyAccountPage from './pages/account/MyAccountPage.tsx';
import {Header} from "@/components/layout/Header.tsx";
import {Footer} from "@/components/layout/Footer.tsx";
import CookieBanner from './components/cookie/CookieBanner.tsx';
import TermsOfServicePage from "@/pages/static/legal/terms/TermsOfServicePage.tsx";
import PrivacyPolicyPage from "@/pages/static/legal/PrivacyPolicyPage.tsx";
import CookiePolicyPage from "@/pages/static/legal/CookiePolicyPage.tsx";
import ScrollToTop from "@/core/ScrollToTop.tsx";
import ConfirmDialogComponent from "@/components/confirm-dialog/ConfirmDialogComponent.tsx";
import ContactSuccessPage from "@/pages/ContactSuccessPage.tsx";
import AdminSportLocationPage from "@/pages/admin/playarea/AdminSportLocationPage.tsx";
import AdminLayout from "@/components/layout/AdminLayout.tsx";
import ScannedDevicePage from "@/pages/ScannedDevicePage.tsx";
import PaymentPage from "@/pages/PaymentPage.tsx";

const PrivateRoute = (props: { children: any }) => {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return <LoadingScreen/>;
    }

    return isAuthenticated ? <>{props.children}</> : <Navigate to="/login"/>;
};

const NonAuthenticatedRoutes = () => {
    const {isAuthenticated} = useAuth()

    if (isAuthenticated) {
        return <Navigate to="/properties" replace/>
    }

    return <Outlet/>
}

const StandardLayout = () => {
    return <div id="layout-container" className="min-h-screen flex flex-col justify-between">
        <div className="flex flex-col flex-grow">
            <Header/>
            <Outlet/>
        </div>
        <Footer/>
    </div>
}

const AdminRoutes = () => {
    const {principal, loading} = useAuth();
    if (loading) {
        return <Progress/>;
    }
    if (!principal?.isAdmin) {
        return <Navigate to="/properties" replace/>
    } else {
        return <AdminLayout/>
    }
}

const App = () => {
    return (
        <GoogleOAuthProvider clientId={ConfigFile.GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <CookieBanner/>
                <ConfirmDialogComponent/>
                <Router>
                    <ScrollToTop/>
                    <AuthProvider>
                        <Toaster/>
                        <Routes>
                            <Route path="admin" element={<AdminRoutes/>}>
                                <Route path="" element={<Navigate to="/admin/sport-locations"/>}/>
                                <Route path="sport-locations" element={<AdminSportLocationPage/>}/>
                            </Route>

                            <Route element={<StandardLayout/>}>
                                <Route path="/" element={<LandingPage/>}/>
                                <Route path="/scan/:slang" element={<ScannedDevicePage/>}/>
                                <Route path="/purchase-order/:id" element={<PaymentPage/>}/>
                                <Route path="/contact" element={<ContactPage/>}/>
                                <Route path="/contact-success" element={<ContactSuccessPage/>}/>
                                <Route path="/faq" element={<FAQPage/>}/>
                                <Route path="/terms" element={<TermsOfServicePage/>}/>
                                <Route path="/policy" element={<PrivacyPolicyPage/>}/>
                                <Route path="/cookies" element={<CookiePolicyPage/>}/>
                            </Route>

                            {/* 🔓 Public pages */}
                            <Route element={<NonAuthenticatedRoutes/>}>
                                <Route path="/login" element={<LoginPage/>}/>
                                <Route path="/register" element={<RegisterPage/>}/>
                                <Route path="/register/confirm" element={<RegisterConfirmationPage/>}/>
                                <Route path="/email-verify" element={<EmailVerifyPage/>}/>
                                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                                <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                            </Route>

                            {/* 🔒 Private (authenticated) routes */}
                            <Route
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout/>
                                    </PrivateRoute>
                                }
                            >
                                <Route path="how-it-works" element={<HowItWorksPage/>}/>
                                <Route path="support" element={<SupportPage/>}/>
                                <Route path="my-account/:tab?" element={<MyAccountPage/>}/>
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace/>}/>
                        </Routes>
                    </AuthProvider>
                </Router>
            </LanguageProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
