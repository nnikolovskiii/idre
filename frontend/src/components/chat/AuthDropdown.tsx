import React from "react";
import { User, LogOut, ChevronDown } from "lucide-react";

interface AuthDropdownProps {
  collapsed: boolean;
  user?: { name?: string; surname?: string; email?: string; username?: string };
  onLogout: () => void;
  onToggleCollapse: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const AuthDropdown: React.FC<AuthDropdownProps> = ({
                                                     collapsed,
                                                     user,
                                                     onLogout,
                                                     onToggleCollapse,
                                                     isAuthenticated,
                                                     onLoginClick,
                                                     onRegisterClick,
                                                   }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
      <section className="flex flex-col">
        <button
            className="flex items-center gap-2 px-1 w-full text-left text-xs font-semibold tracking-wider uppercase  transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
          <User size={16} />
          {!collapsed && <span>Authentication</span>}
          {!collapsed && (
              <ChevronDown
                  size={16}
                  className={`ml-auto transition-transform duration-200 ${
                      isOpen ? "" : "rotate-180"
                  }`}
              />
          )}
        </button>
        {!collapsed && isOpen && (
            <div className="flex flex-col gap-1 mt-2">
              {isAuthenticated ? (
                  <>
                      {user && (
                          <div className="flex w-full justify-start items-start gap-3 p-3 rounded-md text-left">
                              <div>
                                  <div className="font-semibold text-sm">
                                      {user.name && user.surname
                                          ? `${user.name} ${user.surname}`
                                          : user.username}
                                  </div>
                                  <div className="text-xs text-neutral-500">{user.email}</div>
                              </div>
                          </div>
                      )}
                    <button
                        className="flex items-center gap-3 w-full text-left p-2.5 px-3 rounded-md text-sm font-medium text-red-600 transition-all hover:bg-red-600 hover:text-white"
                        onClick={() => {
                          onLogout();
                          if (window.innerWidth <= 768) onToggleCollapse();
                        }}
                        title="Logout"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
              ) : (
                  <>
                    <button
                        className="flex items-center gap-3 w-full text-left p-2.5 px-3 rounded-md text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100"
                        onClick={() => {
                          onLoginClick();
                          if (window.innerWidth <= 768) onToggleCollapse();
                        }}
                        title="Login"
                    >
                      <LogOut size={16} />
                      <span>Login</span>
                    </button>
                    <button
                        className="flex items-center gap-3 w-full text-left p-2.5 px-3 rounded-md text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100"
                        onClick={() => {
                          onRegisterClick();
                          if (window.innerWidth <= 768) onToggleCollapse();
                        }}
                        title="Register"
                    >
                      <User size={16} />
                      <span>Register</span>
                    </button>
                  </>
              )}
            </div>
        )}
      </section>
  );
};

export default AuthDropdown;