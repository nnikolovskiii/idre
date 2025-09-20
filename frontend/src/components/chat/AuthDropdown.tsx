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
    <section className="auth-section">
      <button className="auth-header" onClick={() => setIsOpen(!isOpen)}>
        <User size={16} />
        {!collapsed && <span>Authentication</span>}
        {!collapsed && (
          <ChevronDown size={16} className={isOpen ? "" : "rotated"} />
        )}
      </button>
      {!collapsed && isOpen && (
        <div className="auth-items">
          {isAuthenticated ? (
            <>
              {user && (
                <div className="profile-info">
                  <User size={16} />
                  <div>
                    <div className="profile-name">
                      {user.name && user.surname
                        ? `${user.name} ${user.surname}`
                        : user.username}
                    </div>
                    <div className="profile-email">{user.email}</div>
                  </div>
                </div>
              )}
              <button
                className="settings-item logout-btn"
                onClick={() => {
                  onLogout();
                  onToggleCollapse();
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
                className="settings-item"
                onClick={() => {
                  onLoginClick();
                  onToggleCollapse();
                }}
                title="Login"
              >
                <LogOut size={16} />
                <span>Login</span>
              </button>
              <button
                className="settings-item"
                onClick={() => {
                  onRegisterClick();
                  onToggleCollapse();
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
