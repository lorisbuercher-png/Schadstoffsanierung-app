"use client";

import "./ui.css";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthUserMenu from "./AuthUserMenu";

export type AppRole = "admin" | "vorarbeiter";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  role?: AppRole;
  onRoleChange?: (role: AppRole) => void;
  suvaBadge?: number;
  maengelBadge?: number;
};

type IconName = "home" | "shield" | "alert" | "site" | "clock" | "users" | "tools" | "folder" | "team";
type NavItem = { href: string; label: string; icon: IconName; badge?: number; priority?: boolean };

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3 8 7.5 9.5 4.5-1.5 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-5"/></>,
  alert: <><path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  site: <><path d="M4 21h16M6 21V8h12v13M9 8V4h6v4M9 12h2M13 12h2M9 16h2M13 16h2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  tools: <path d="m14.7 6.3 3-3a4 4 0 0 1-5.4 5.4l-6.6 6.6a2 2 0 1 0 3 3l6.6-6.6a4 4 0 0 1 5.4-5.4l-3 3-3-3Z"/>,
  folder: <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z"/>,
  team: <><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 8h4M19 6v4"/></>,
};

function Icon({ name }: { name: IconName }) {
  return <svg className="bb-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function AppShell({ children, title, subtitle, backHref, backLabel = "Zurück", action, role: controlledRole, onRoleChange, suvaBadge = 0, maengelBadge = 0 }: AppShellProps) {
  const pathname = usePathname();
  const [menuOffen, setMenuOffen] = useState(false);
  const [localRole, setLocalRole] = useState<AppRole>("admin");
  const role = controlledRole ?? localRole;

  useEffect(() => {
    if (controlledRole) return;
    const saved = localStorage.getItem("bb-role");
    if (saved === "admin" || saved === "vorarbeiter") setLocalRole(saved);
  }, [controlledRole]);

  function rolleWaehlen(nextRole: AppRole) {
    if (!controlledRole) setLocalRole(nextRole);
    localStorage.setItem("bb-role", nextRole);
    window.dispatchEvent(new CustomEvent("bb-role-change", { detail: nextRole }));
    onRoleChange?.(nextRole);
    setMenuOffen(false);
  }

  const adminNavigation: NavItem[] = [
    { href: "/", icon: "home", label: "Übersicht" },
    { href: "/#admin-suva", icon: "shield", label: "SUVA-Prüfungen", badge: suvaBadge, priority: suvaBadge > 0 },
    { href: "/#admin-maengel", icon: "alert", label: "Offene Mängel", badge: maengelBadge, priority: maengelBadge > 0 },
    { href: "/baustellen", icon: "site", label: "Baustellen" },
    { href: "/kalender", icon: "clock", label: "Planung" },
    { href: "/mitarbeiter", icon: "users", label: "Mitarbeiter" },
    { href: "/geraete", icon: "tools", label: "Geräte" },
    { href: "/dokumente", icon: "folder", label: "Projektakte" },
  ];
  const foremanNavigation: NavItem[] = [
    { href: "/", icon: "home", label: "Heute" },
    { href: "/mitarbeiter", icon: "team", label: "Team" },
    { href: "/baustellen", icon: "site", label: "Baustelle" },
    { href: "/kalender", icon: "clock", label: "Planung" },
  ];
  const navigation = role === "admin" ? adminNavigation : foremanNavigation;

  function istAktiv(href: string) {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className={`bb-shell bb-role-${role}`}>
      <aside className={`bb-sidebar ${menuOffen ? "mobile-open" : ""}`}>
        <button type="button" className="bb-sidebar-close" onClick={() => setMenuOffen(false)} aria-label="Menü schliessen">×</button>
        <Link href="/" className="bb-brand bb-brand-logo" aria-label="B&B Schadstoffsanierung – Übersicht"><Image src="/bb-logo.png" alt="B&B Schadstoffsanierung" width={546} height={300} priority /></Link>
        <div className="bb-sidebar-role"><span>{role === "admin" ? "Geschäftsleitung" : "Baustellenmodus"}</span><strong>{role === "admin" ? "Admin-Cockpit" : "Vorarbeiter"}</strong></div>
        <nav className="bb-nav" aria-label="Hauptnavigation">
          {navigation.map((eintrag) => <Link key={eintrag.label} href={eintrag.href} onClick={() => setMenuOffen(false)} className={`${istAktiv(eintrag.href) ? "active" : ""} ${eintrag.priority ? "priority" : ""}`}><Icon name={eintrag.icon} /><span className="bb-nav-label">{eintrag.label}</span>{!!eintrag.badge && <b className="bb-nav-badge">{eintrag.badge}</b>}</Link>)}
        </nav>
        <div className="bb-sidebar-footer"><Icon name="shield" /><span>Sicherheit hat Priorität</span></div>
      </aside>

      {menuOffen && <button type="button" className="bb-sidebar-overlay" onClick={() => setMenuOffen(false)} aria-label="Menü schliessen" />}

      <main className="bb-main">
        <header className="bb-topbar">
          <div className="bb-topbar-left"><button type="button" className="bb-mobile-menu" onClick={() => setMenuOffen(true)} aria-label="Navigation öffnen">☰</button><div className="bb-topbar-context"><span className="bb-live-dot" />B&amp;B Arbeitsportal</div></div>
          <div className="bb-topbar-actions">
            <div className="bb-role-switch" aria-label="Ansicht wechseln"><button type="button" className={role === "admin" ? "active" : ""} onClick={() => rolleWaehlen("admin")}>Admin</button><button type="button" className={role === "vorarbeiter" ? "active" : ""} onClick={() => rolleWaehlen("vorarbeiter")}>Vorarbeiter</button></div>
            <button className="bb-icon-button" type="button" aria-label="Benachrichtigungen"><span aria-hidden="true">⌁</span>{(suvaBadge + maengelBadge) > 0 && <span className="bb-notification-dot">{Math.min(9, suvaBadge + maengelBadge)}</span>}</button>
            <AuthUserMenu />
          </div>
        </header>

        <div className="bb-content">
          {(title || backHref || action) && <section className="bb-page-header"><div>{backHref && <Link href={backHref} className="bb-back-link">← {backLabel}</Link>}{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div>{action && <div className="bb-page-header-action">{action}</div>}</section>}
          {children}
        </div>
        {role === "vorarbeiter" && <nav className="bb-bottom-nav" aria-label="Mobile Navigation">{foremanNavigation.map((item) => <Link key={item.label} href={item.href} className={istAktiv(item.href) ? "active" : ""}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>}
      </main>
    </div>
  );
}
