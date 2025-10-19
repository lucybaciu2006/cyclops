import {Button} from "@/components/ui/button";
import {Link} from "react-router-dom";
import {useAuth} from '@/contexts/auth.context.tsx';
import React from 'react';
import {useLanguage} from '@/contexts/language.context';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "../ui/dropdown-menu";
import {EventService, EventType} from "@/core/event.service.ts";


const AddPropertyButton = () => {
    const { t } = useLanguage();

    const openCreateProperty = () => {
        EventService.emit(EventType.OPEN_CREATE_PROPERTY);
    }

    return <Button
        onClick={openCreateProperty}
        className="btn-primary"
    >
        {/*<Plus className="mr-2 h-5 w-5"/>*/}
        {t('header.addProperty')}
    </Button>
}

export const Header = () => {

    const {isAuthenticated, principal, logout} = useAuth();
    // const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogout = () => {
        logout();
    }

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
            <div className="mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/"
                      className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    <img src="/logo.svg" alt="Logo" className="h-[44px] cursor-pointer"/>
                </Link>

                <div className="flex gap-2 items-center">
                    {!isAuthenticated && (
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" asChild>
                                    <Link to="/login">{t('header.login')}</Link>
                                </Button>
                                <Button variant="default" asChild>
                                    <Link to="/register"  className="text-white">{t('header.register')}</Link>
                                </Button>
                            </div>
                        )
                    }

                    {isAuthenticated && (
                        <div className="flex items-center gap-10">
                            <Button variant="link" className="px-0 font-medium text-sm" asChild>
                                <Link to="/properties">{t('header.properties') ?? "Properties"}</Link>
                            </Button>

                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="link" className="px-0 font-medium text-sm">
                                        {t('header.myAccount') ?? "My Account"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" >
                                    <DropdownMenuItem asChild>
                                        <Link to="/my-account">{t('header.profile') ?? "Profil"}</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/analytics">{t('header.analytics') ?? "Analytics"}</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/subscriptions">{t('header.subscriptions') ?? "Subscriptions"}</Link>
                                    </DropdownMenuItem>
                                    {principal?.isAdmin && (
                                        <DropdownMenuItem asChild>
                                            <Link to="/admin">{t('header.admin')}</Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleLogout}>
                                        {t('header.logout') ?? "Logout"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AddPropertyButton/>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
