import {Outlet, NavLink} from "react-router-dom";
import {Header} from "@/components/layout/Header.tsx";

export default function AdminLayout() {
    return (
        <>
            <Header/>
            <div className="flex h-screen">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
                    <div className="text-2xl font-bold">Admin</div>
                    <nav className="space-y-4">
                        <NavItem to="/admin/sport-locations" label="Sport Locations"/>
                        <NavItem to="/admin/users" label="Users"/>
                        <NavItem to="/admin/settings" label="Settings"/>
                        {/* Add more items as needed */}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
                    <Outlet/>
                </main>
            </div>
        </>
    );
}

function NavItem({to, label}: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            className={({isActive}) =>
                `block px-3 py-2 rounded-md transition-colors ${
                    isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
            }
        >
            {label}
        </NavLink>
    );
}