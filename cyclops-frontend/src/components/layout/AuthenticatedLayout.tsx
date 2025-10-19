import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header.tsx';
import CompactFooter from '@/components/layout/CompactFooter.tsx';
import {Footer} from "@/components/layout/Footer.tsx";

const AuthenticatedLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Fixed Header */}
            <Header />

                {/* Main Content */}
                <main className="flex flex-col flex-1 overflow-y-auto">
                    <div className="flex grow flex-col justify-between max-w-6xl mx-auto w-full px-6 py-4">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
        </div>
    );
};

export default AuthenticatedLayout;
