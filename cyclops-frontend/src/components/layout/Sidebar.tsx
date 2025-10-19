import React, {useState} from 'react';
import {cn} from '@/lib/utils';
import {House, ChevronRight, Plus, User, ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useNavigate, useLocation} from 'react-router-dom';
import {useProperty} from '@/contexts/property.context';
import {useAuth} from '@/contexts/auth.context.tsx';
import {useLanguage} from '@/contexts/language.context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu.tsx';

interface SidebarProps {
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({className}) => {
    const {properties, selectedProperty, selectProperty} = useProperty();
    const {principal, logout} = useAuth();
    const {t} = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();


    const handlePropertySelect = (id: string) => {
        selectProperty(id);
        navigate(`/properties/${id}/details`);

    };

    const isCurrentPath = (path: string) => {
        return location.pathname.endsWith(path);
    };

    return (
        <div className={cn(
            "h-screen w-64 bg-sidebar p-4 flex flex-col ",
            className
        )}>
        {/*    <DropdownMenu>*/}
        {/*        <DropdownMenuTrigger asChild>*/}
        {/*            <button*/}
        {/*                className="w-full flex items-center py-1 text-left rounded-md hover:bg-gray-100 transition group"*/}
        {/*            >*/}
        {/*                <div className="w-12 h-12 mr-3 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">*/}
        {/*                    {selectedProperty?.thumbnail ? (*/}
        {/*                        <img*/}
        {/*                            src={selectedProperty.thumbnail.url}*/}
        {/*                            alt={selectedProperty.name}*/}
        {/*                            className="w-full h-full object-cover"*/}
        {/*                        />*/}
        {/*                    ) : (*/}
        {/*                        <House className="w-5 h-5 text-gray-400"/>*/}
        {/*                    )}*/}
        {/*                </div>*/}

        {/*                <div className="flex flex-col flex-grow">*/}
        {/*<span className="font-medium text-sm text-foreground leading-tight">*/}
        {/*  {selectedProperty?.name ?? t('sidebar.selectProperty')}*/}
        {/*</span>*/}
        {/*                    <span className="text-xs text-muted-foreground">*/}
        {/*  {selectedProperty?.subscriptionStatus ?? ''}*/}
        {/*</span>*/}
        {/*                </div>*/}

        {/*                <ChevronDown className="ml-auto h-4 w-4 text-gray-600 group-hover:text-gray-800 transition"/>*/}
        {/*            </button>*/}
        {/*        </DropdownMenuTrigger>*/}

        {/*        <DropdownMenuContent align="start" className="w-full bg-white rounded-md border p-2 mt-2">*/}
        {/*            {properties && properties.length === 0 && (*/}
        {/*                <div className="text-sm text-muted-foreground px-2 py-1">*/}
        {/*                    {t('sidebar.noProperties')}*/}
        {/*                </div>*/}
        {/*            )}*/}

        {/*            {properties?.map((property) => (*/}
        {/*                <DropdownMenuItem*/}
        {/*                    key={property._id}*/}
        {/*                    onClick={() => handlePropertySelect(property._id)}*/}
        {/*                >*/}
        {/*                    <div*/}
        {/*                        className={cn(*/}
        {/*                            "flex min-w-[200px] items-center w-full px-2 py-2 rounded-md gap-2 cursor-pointer",*/}
        {/*                            selectedProperty?._id === property._id*/}
        {/*                                ? "bg-gray-200/70"*/}
        {/*                                : "hover:bg-gray-200/60"*/}
        {/*                        )}*/}
        {/*                    >*/}
        {/*                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">*/}
        {/*                            {property.thumbnail ? (*/}
        {/*                                <img*/}
        {/*                                    src={property.thumbnail.url}*/}
        {/*                                    alt={property.name}*/}
        {/*                                    className="w-full h-full object-cover"*/}
        {/*                                />*/}
        {/*                            ) : (*/}
        {/*                                <House className="w-4 h-4 text-gray-400"/>*/}
        {/*                            )}*/}
        {/*                        </div>*/}
        {/*                        <div className="flex flex-col">*/}
        {/*                            <span className="text-sm font-medium">{property.name}</span>*/}
        {/*                            <span className="text-xs text-muted-foreground">*/}
        {/*      {property.subscriptionStatus ?? t('sidebar.unknownStatus')}*/}
        {/*    </span>*/}
        {/*                        </div>*/}
        {/*                    </div>*/}
        {/*                </DropdownMenuItem>*/}
        {/*            ))*/}
        {/*            }*/}
        {/*        </DropdownMenuContent>*/}
        {/*    </DropdownMenu>*/}


                <div className="mt-4 space-y-1 shrink-0">
                    {/*<h2 className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-2">*/}
                    {/*    {t('sidebar.manage')}*/}
                    {/*</h2>*/}

                    <NavItem
                        label={t('common.properties')}
                        path={'/properties'}
                        active={isCurrentPath('/properties')}
                    />
                    {/*<NavItem*/}
                    {/*    label="Assistant Instructions"*/}
                    {/*    path={`/properties/${selectedProperty._id}/instructions`}*/}
                    {/*    active={isCurrentPath('/instructions')}*/}
                    {/*/>*/}
                    {/* <NavItem
                  label="Istoric Apeluri"
                  path={`/properties/${selectedProperty._id}/calls`}
                  active={isCurrentPath('/analytics')}
              /> */}
                    <NavItem
                        label={t('common.analytics')}
                        path={`/analytics`}
                        active={isCurrentPath('/analytics')}
                    />
                    <NavItem
                        label={t('nav.account')}
                        path={`/my-account`}
                        active={isCurrentPath('/my-account')}
                    />
                </div>

            {/*<div className="mt-auto pt-4 border-t">*/}
            {/*    <div className="flex items-center p-2">*/}
                    {/* Dropdown Icon instead of initials */}
                    {/*<DropdownMenu>*/}
                    {/*    <DropdownMenuTrigger*/}
                    {/*        className="rounded-full bg-muted w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition cursor-pointer focus:outline-none">*/}
                    {/*        <User className="h-5 w-5 text-muted-foreground"/>*/}
                    {/*    </DropdownMenuTrigger>*/}
                    {/*    <DropdownMenuContent align="end" className="w-48 bg-white rounded-lg border p-2 m-2 ml-6">*/}
                    {/*        <DropdownMenuItem*/}
                    {/*            onClick={() => navigate("/my-account")}*/}
                    {/*            className="cursor-pointer hover:bg-muted"*/}
                    {/*        >*/}
                    {/*            {t('sidebar.profile')}*/}
                    {/*        </DropdownMenuItem>*/}
                    {/*        <DropdownMenuItem*/}
                    {/*            onClick={() => navigate("/subscription")}*/}
                    {/*            className="cursor-pointer hover:bg-muted"*/}
                    {/*        >*/}
                    {/*            {t('sidebar.subscription')}*/}
                    {/*        </DropdownMenuItem>*/}
                    {/*        <DropdownMenuItem*/}
                    {/*            onClick={() => navigate("/support")}*/}
                    {/*            className="cursor-pointer hover:bg-muted"*/}
                    {/*        >*/}
                    {/*            {t('sidebar.support')}*/}
                    {/*        </DropdownMenuItem>*/}

                    {/*        <DropdownMenuSeparator className="my-1 border-t border-gray-200"/>*/}

                    {/*        <DropdownMenuItem*/}
                    {/*            className="cursor-pointer hover:bg-muted"*/}
                    {/*            onClick={logout}*/}
                    {/*        >*/}
                    {/*            {t('sidebar.logout')}*/}
                    {/*        </DropdownMenuItem>*/}
                    {/*    </DropdownMenuContent>*/}
                    {/*</DropdownMenu>*/}

                    {/* Name and email */}
                    {/*<div className="ml-2">*/}
                    {/*    <p className="text-sm font-medium">{principal?.name}</p>*/}
                    {/*    <p className="text-xs text-gray-500">{principal?.email}</p>*/}
                    {/*</div>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

interface NavItemProps {
    label: any;
    path: string;
    active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({label, path, active}) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(path)}
            className={cn(
                "flex items-center w-full px-3 py-2 text-sm rounded-md text-left hover:bg-muted text-gray-700",
                active
                    ? "text-primary font-bold"
                    : ""
            )}
        >
            <span className="">{label}</span>
        </button>
    );
};

export default Sidebar;
