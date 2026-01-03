import { Link, useLocation } from "react-router-dom";
import { Users, UserCircle, Sun, Moon, LogOut, User as UserIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FriendRequestDropdown from "@/components/friends/FriendRequestDropdown";
import NotificationBadge from "@/components/NotificationBadge";
import logo from "@/assets/logo.png";

export default function Navbar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { icon: MessageCircle, label: "Chat", path: "/" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: UserCircle, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Fun Chat" className="h-10 w-10 rounded-full object-cover shadow-glow" />
            <span className="hidden text-xl font-heading font-bold text-primary sm:block">Fun Chat</span>
          </Link>

          <div className="flex items-center gap-1">
            {user && (
              <>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button variant={isActive ? "default" : "ghost"} size="sm" className="gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}

                <FriendRequestDropdown />
                <NotificationBadge />
              </>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="relative overflow-hidden"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.username || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : location.pathname !== '/auth' && (
              <Button asChild className="ml-2 gap-2 bg-primary hover:bg-primary-light">
                <Link to="/auth"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">Đăng nhập</span></Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
