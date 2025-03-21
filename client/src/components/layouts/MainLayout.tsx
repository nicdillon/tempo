import { useAuth } from "@/components/providers/AuthProvider";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon, UserIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isPremium } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const navItems = [
    { name: "Timer", path: "/" },
    { name: "Analytics", path: "/analytics", premium: true },
    { name: "Sessions", path: "/sessions", premium: true },
    { name: "Settings", path: "/settings" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary">
                  Tempo
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Toggle between light and dark regardless of current theme (including system)
                  const htmlElement = document.documentElement;
                  const isDark = htmlElement.classList.contains('dark');
                  setTheme(isDark ? "light" : "dark");
                }}
                className="mr-2"
                aria-label={document.documentElement.classList.contains('dark') ? "Switch to light mode" : "Switch to dark mode"}
              >
                {document.documentElement.classList.contains('dark') ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                        <span className="text-xs font-normal mt-1">
                          {isPremium ? (
                            <span className="text-amber-500">Premium Member</span>
                          ) : (
                            <span>Free User</span>
                          )}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer w-full">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {navItems.map((item) => {
              const isActive = location === item.path;
              // Always allow access to all routes to show demo data for both non-logged-in users
              // and free tier users
              const isPremiumRoute = false; // No longer redirect to /subscribe

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                    "transition-colors"
                  )}
                >
                  {item.name}
                  {/* Show a lock icon for premium features for both anonymous and free users */}
                  {item.premium && (!user || (user && !isPremium)) && (
                    <LockIcon className="h-3 w-3 ml-1" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Tempo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
