"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Terminal,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Data", icon: UploadCloud },
  { href: "/analysis", label: "Bias Analysis", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar/95 backdrop-blur md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-normal">FairLy</div>
            <div className="text-xs text-muted-foreground">Bias intelligence</div>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">API</span>
              <Badge variant="success">Ready</Badge>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              FastAPI fairness service connected at localhost:8000.
            </p>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">FairLy</span>
            </div>
            <div className="hidden flex-1 items-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-muted-foreground md:flex">
              <Terminal className="mr-2 h-4 w-4 text-primary" />
              <span className="text-primary">$</span>
              <span className="ml-2">scan --dataset current.csv --explain bias</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/analysis">Run Scan</Link>
            </Button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
