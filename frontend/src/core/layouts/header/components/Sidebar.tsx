import {
  X,
  Home,
  LayoutDashboard,
  Users,
  Car,
  HousePlus,
  MessageCircle,
  Users2Icon,
  CreditCard,
  KeyRound,
  ClipboardList,
} from "lucide-react";
import { NavLink } from "react-router";
import { ROLES, type RolesType } from "../../../../shared/types/role.type";
import LogoutButton from "../../../../shared/components/ui/LogoutButton";

type Props = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: Props) {
  const userRole = JSON.parse(localStorage.getItem("user")!).role as RolesType;

  const rolePath =
    userRole === ROLES.ADMIN
      ? "adm"
      : userRole === ROLES.OWNER
        ? "owner"
        : userRole === ROLES.MANAGER
          ? "manager"
          : "employee";

  const navLinks: {
    name: string;
    path: string;
    icon: React.ElementType;
    roles: RolesType[];
  }[] = [
    {
      name: "Panel Control",
      path: `/${rolePath}/dashboard`,
      icon: LayoutDashboard,
      roles: [ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE],
    },
    {
      name: "Rentadoras",
      path: "/adm/renters",
      icon: ClipboardList,
      roles: [ROLES.ADMIN],
    },
    {
      name: "Sedes",
      path: `/${rolePath}/branches`,
      icon: HousePlus,
      roles: [ROLES.OWNER, ROLES.ADMIN],
    },
    {
      name: "Empleados",
      path: `/${rolePath}/employees`,
      icon: Users2Icon,
      roles: [ROLES.MANAGER, ROLES.OWNER, ROLES.ADMIN],
    },
    {
      name: "Rentas",
      path: `/${rolePath}/rentals`,
      icon: Car,
      roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.ADMIN],
    },
    {
      name: "Feedbacks pendientes",
      path: `/${rolePath}/feedbacks`,
      icon: MessageCircle,
      roles: [ROLES.EMPLOYEE, ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN],
    },
    {
      name: "Clientes",
      path: `/${rolePath}/customers`,
      icon: Users,
      roles: [ROLES.EMPLOYEE, ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN],
    },
    {
      name: "Vehículos",
      path: `/${rolePath}/vehicles`,
      icon: Car,
      roles: [ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.ADMIN],
    },
    // Admin-only
    {
      name: "Usuarios",
      path: "/adm/users",
      icon: KeyRound,
      roles: [ROLES.ADMIN],
    },
    {
      name: "Planes",
      path: "/adm/plans",
      icon: CreditCard,
      roles: [ROLES.ADMIN],
    },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-30 transition-all duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
              <div className="flex items-center space-x-3">
                <Home size={20} />
                <div>
                  <h2 className="text-lg font-bold">RentCheck</h2>
                  <p className="text-xs opacity-90">Alquileres</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {/* Admin section dividers */}
              {navLinks.map((link, idx) => {
                if (!link.roles.includes(userRole as RolesType)) return null;

                // Divider before admin-only section
                const prevLink = navLinks
                  .slice(0, idx)
                  .filter((l) => l.roles.includes(userRole as RolesType))
                  .at(-1);
                const isAdminOnly =
                  link.roles.length === 1 && link.roles[0] === ROLES.ADMIN;
                const prevWasAdminOnly = prevLink
                  ? prevLink.roles.length === 1 &&
                    prevLink.roles[0] === ROLES.ADMIN
                  : false;
                const showDivider = isAdminOnly && !prevWasAdminOnly;

                return (
                  <div key={link.path}>
                    {showDivider && (
                      <div className="pt-3 pb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4">
                          Administración
                        </p>
                        <div className="h-px bg-slate-100 mt-1 mx-2" />
                      </div>
                    )}
                    <NavLink
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-white"
                            : "hover:bg-primary/10"
                        }`
                      }
                    >
                      <link.icon size={18} />
                      <span className="font-medium text-sm">{link.name}</span>
                    </NavLink>
                  </div>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-primary-foreground/20">
              <LogoutButton className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
