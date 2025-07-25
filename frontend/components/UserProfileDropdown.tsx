/**
 * User Profile Dropdown Component
 *
 * Displays user information and provides access to profile actions like logout.
 * Shows user avatar, name, email, and account management options.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/frontend/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Button } from "@/frontend/components/ui/button";
import {
  User,
  Settings,
  LogOut,
  Shield,
  Database,
  ChevronDown,
  LogIn,
  UserPlus,
  Sparkles,
  Github,
  Info,
  Calendar,
  Activity
} from "lucide-react";
import { getUserTierInfo } from "@/lib/tierSystem";
import AuthDialog from "./auth/AuthDialog";
import { useAuthDialog } from "@/frontend/hooks/useAuthDialog";

const UserProfileDropdown: React.FC = () => {
  const { user, logout, isGuest, guestUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tierInfo, setTierInfo] = useState<any>(null);
  const authDialog = useAuthDialog();

  // Load tier information
  useEffect(() => {
    const loadTierInfo = async () => {
      if (!user) return;

      try {
        const info = await getUserTierInfo();
        setTierInfo(info);
      } catch (error) {
        console.error("Error loading tier info:", error);
      }
    };

    loadTierInfo();
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  // Don't render on authentication pages
  const isAuthPage = location.pathname.startsWith("/auth/");
  if (isAuthPage) return null;

  // Show guest user interface if not authenticated
  if (!user && isGuest) {
    return (
      <>
        <div className="flex gap-2 p-2">
          <Button
            onClick={() => authDialog.navigateToLogin()}
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-sm"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in
          </Button>
          <Button
            onClick={() => authDialog.navigateToSignup()}
            variant="default"
            size="sm"
            className="flex-1 h-9 text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign up
          </Button>
        </div>

        {/* Guest status indicator */}
        <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
          {guestUser && (
            <span>
              {guestUser.messagesUsed}/{guestUser.maxMessages} free messages
              used
            </span>
          )}
        </div>

        <AuthDialog
          isOpen={authDialog.isOpen}
          onClose={authDialog.closeDialog}
          initialMode={authDialog.mode}
          title={authDialog.title}
          description={authDialog.description}
        />
      </>
    );
  }

  // Don't render if no user and not guest
  if (!user) return null;

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = user.name ? getInitials(user.name) : "U";
  const displayName = user.name || "User";
  const displayEmail = user.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 px-3 py-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {/* User Avatar */}
          <div className="w-8 h-8 shrink-0 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium shadow-sm">
            {userInitials}
          </div>

          {/* User Info */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-sidebar-foreground truncate max-w-24">
                {displayName}
              </span>
              {tierInfo?.tier === "premium" && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                  PRO
                </span>
              )}
              {tierInfo?.tier === "admin" && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-2 bg-card border-border"
        sideOffset={8}
      >
        {/* User Header */}
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium shadow-sm">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {displayName}
                </span>
                {tierInfo?.tier === "premium" && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                    PRO
                  </span>
                )}
                {tierInfo?.tier === "admin" && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {displayEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* User Actions */}
        <DropdownMenuItem
          onClick={() => navigate("/settings#profile")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/settings#customization")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Sparkles className="h-4 w-4" />
          <span>Customization</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/settings#storage")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Database className="h-4 w-4" />
          <span>Storage</span>
        </DropdownMenuItem>

        {/* Admin Panel - Only show for admin users */}
        {tierInfo?.tier === "admin" && (
          <DropdownMenuItem
            onClick={() => navigate("/admin")}
            className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/20 dark:hover:text-orange-300"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Panel</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Github */}
        <DropdownMenuItem
          onClick={() => window.open("https://github.com/cyberboyayush/AVChat", "_blank")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Github className="h-4 w-4" />
          <span>Github</span>
        </DropdownMenuItem>

        {/* About */}
        <DropdownMenuItem
          onClick={() => navigate("/about")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Info className="h-4 w-4" />
          <span>About</span>
        </DropdownMenuItem>

        {/* Changelog */}
        <DropdownMenuItem
          onClick={() => navigate("/changelog")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Calendar className="h-4 w-4" />
          <span>Changelog</span>
        </DropdownMenuItem>

        {/* Status */}
        <DropdownMenuItem
          onClick={() => window.open("https://status.avchat.xyz", "_blank")}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Activity className="h-4 w-4" />
          <span>Status</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem
          onClick={handleSettings}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-destructive hover:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
