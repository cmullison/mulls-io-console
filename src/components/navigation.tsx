"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/state/session";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/state/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME } from "@/constants";
import { useEffect, useState, useRef } from "react";

type NavItem = {
  name: string;
  href: string;
};

const ActionButtons = () => {
  const { session, isLoading } = useSessionStore();
  const { setIsOpen } = useNavStore();

  if (isLoading) {
    return <Skeleton className="h-10 w-[80px] bg-primary" />;
  }

  if (session) {
    return (
      <Button
        variant="ghost"
        onClick={() => setIsOpen(false)}
        className="bg-transparent border-none text-muted-foreground mx-auto hover:text-secondary-foreground hover:scale-105 hover:bg-transparent hover:border-none no-underline px-3 h-16 flex items-center text-sm font-medium transition-colors relative w-full"
      >
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="bg-white mx-auto rounded-full text-primary-foreground border-cyan-500 border-2 hover:bg-white/90 hover:border-cyan-300/90 hover:scale-105 transition-all duration-300 w-1/2 md:w-auto"
      asChild
      onClick={() => setIsOpen(false)}
    >
      <Link href="/sign-in">Sign In</Link>
    </Button>
  );
};

export function Navigation() {
  const { session, isLoading } = useSessionStore();
  const { isOpen, setIsOpen } = useNavStore();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navItems: NavItem[] = [
    ...(session
      ? ([
          { name: "Features", href: "features" },
          { name: "FAQ", href: "faq" },
        ] as NavItem[])
      : ([
          { name: "Features", href: "features" },
          { name: "FAQ", href: "faq" },
        ] as NavItem[])),
  ];

  const isActiveLink = (itemHref: string) => {
    if (itemHref === "/") {
      return pathname === "/";
    }
    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        mobileMenuRef.current &&
        menuButtonRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop =
        element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <section id="home" />
      <nav
        className={cn(
          "bg-muted/60 fixed top-0 w-full z-50 transition-all duration-300 shadow-none",
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-gray-200"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => scrollToSection("home")}
                className={cn(
                  "text-xl font-serif md:text-2xl font-bold flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-transparent hover:border-none",
                  scrolled
                    ? "hover:text-muted-foreground"
                    : "text-secondary-foreground hover:text-muted-foreground"
                )}
              >
                <CameraIcon
                  className={cn(
                    "w-6 h-6 md:w-7 md:h-7",
                    scrolled ? "text-lime-500" : "text-lime-500"
                  )}
                />
                {SITE_NAME}
              </Button>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-6">
              <div className="flex items-baseline space-x-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  navItems.map((item) => (
                    <Button
                      variant="ghost"
                      key={item.name}
                      onClick={() => scrollToSection(item.href)}
                      className={cn(
                        "cursor-pointer bg-transparent border-none no-underline px-3 h-16 flex items-center text-sm font-medium hover:scale-105 transition-all duration-300 relative hover:bg-transparent hover:border-none",
                        scrolled
                          ? "hover:text-muted-foreground"
                          : "bg-transparent text-secondary-foreground hover:text-muted-foreground",
                        isActiveLink(item.href) &&
                          "text-foreground after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-foreground"
                      )}
                    >
                      {item.name}
                    </Button>
                  ))
                )}
              </div>
              <ActionButtons />
            </div>

            {/* Mobile Navigation Toggle */}
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden cursor-pointer hover:bg-transparent hover:border-none",
                scrolled
                  ? "hover:text-muted-foreground"
                  : "bg-transparent text-secondary-foreground hover:text-muted-foreground"
              )}
              onClick={() => {
                const newState = !isOpen;
                setIsOpen(newState);
              }}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden bg-background/95 transition-all duration-300"
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-4 mb-4 sm:mb-2 md:mb-0">
                {navItems.map((link) => (
                  <Button
                    variant="ghost"
                    key={link.name}
                    onClick={() => scrollToSection(link.href)}
                    className="cursor-pointer bg-transparent border-none text-muted-foreground mx-auto hover:text-primary-foreground hover:bg-transparent hover:border-none hover:scale-105 w-full transition-all duration-300 py-2 text-left"
                    aria-label={`Go to ${link.name.toLowerCase()} section`}
                  >
                    {link.name}
                  </Button>
                ))}
                <ActionButtons />
              </nav>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
