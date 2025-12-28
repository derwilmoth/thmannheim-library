"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
  };

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <div className="flex flex-col">
              <span className="text-xs font-medium tracking-wider">
                Technische Hochschule
              </span>
              <span className="text-xl font-bold -mt-1">mannheim</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              Startseite
            </Link>
            <Link href="/books" className="hover:opacity-80 transition-opacity">
              Katalog
            </Link>
            {user && (
              <Link
                href="/my-loans"
                className="hover:opacity-80 transition-opacity"
              >
                Meine Ausleihen
              </Link>
            )}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="hover:opacity-80 transition-opacity"
              >
                Verwaltung
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-20 bg-primary-foreground/20 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm">
                  {user.name}
                  {user.isAdmin && (
                    <span className="ml-1 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-background"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-primary-foreground hover:cursor-pointer"
                  >
                    Anmelden
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:cursor-pointer">
                    Registrieren
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
