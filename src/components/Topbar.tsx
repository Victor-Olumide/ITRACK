
// Full-width app bar with branding, quick actions, search, and the active user.

import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Ticket,
  UserRound,
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { homePathForRole, useAuth } from "../contexts/AuthContext";
import type { PublicUser, UserRole } from "../types/types";
import { useChangePasswordMutation } from "../lib/api/auth/auth-api";
import { getApiErrorMessage } from "../lib/api/error-message";
import type { SubmitEvent } from "react";
import GlobalSearch from "./GlobalSearch";
import { pathsForRole } from "../utils/role-paths";

const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface TopbarProps {
  onMenuClick: () => void;
  user: PublicUser | null;
  role: UserRole;
}

export default function Topbar({ onMenuClick, user, role }: TopbarProps) {
  const { logout, updateProfile, endSessionLocally } = useAuth();
  const navigate = useNavigate();

  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const [logoutError, setLogoutError] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const ticketsPath =
    role === "Employee"
      ? "/employee/tickets"
      : role === "Technician"
        ? "/technician/tickets"
        : "/tickets";

  const ticketsLabel = role === "IT Admin" ? "Tickets" : "My tickets";
  const settingsPath = pathsForRole(role).settings;
  const homePath = homePathForRole(role);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !profileMenuRef.current?.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  const openPasswordDialog = () => {
    setPasswordChangeError("");
    setProfileError("");
    setProfileMessage("");
    setProfileName(user?.name ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileMenuOpen(false);
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    if (isChangingPassword) return;
    setPasswordDialogOpen(false);
  };

  const handlePasswordDialogOpenChange = (open: boolean) => {
    if (isChangingPassword) return;
    setPasswordDialogOpen(open);
  };

  const handleProfileUpdate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setIsUpdatingProfile(true);

    try {
      await updateProfile(profileName.trim());
      setProfileMessage("Your profile has been updated.");
    } catch (error) {
      setProfileError(
        getApiErrorMessage(
          error,
          "Could not update your profile. Please try again.",
        ),
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordChangeError("");

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("The new passwords do not match.");
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();

      endSessionLocally();

      navigate("/login", {
        replace: true,
        state: { notice: "Password changed. Sign in again on each device." },
      });
    } catch (error) {
      setPasswordChangeError(
        getApiErrorMessage(
          error,
          "Could not change your password. Please try again.",
        ),
      );
    }
  };

  const handleLogout = async () => {
    setLogoutError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError(
        "Could not sign out. Check your connection and try again.",
      );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2.5 bg-[#101c52] px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2f54a] md:hidden"
          aria-label="Toggle navigation"
          title="Toggle navigation"
        >
          <Menu size={19} />
        </button>

        <Link
          to={homePath}
          className="flex w-auto shrink-0 items-center gap-2 md:w-44"
        >
          <Logo size={30} className="rounded-[3.5px]" />

          <span className="text-[15px] font-bold tracking-tight text-white">
            ITrack
          </span>
        </Link>

        <GlobalSearch role={role} />

        <div className="flex-1" />

        <div className="relative shrink-0" ref={profileMenuRef}>
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2f54a]"
            aria-label={`Account menu for ${user?.name ?? "user"}`}
            aria-expanded={profileMenuOpen}
            aria-controls="profile-menu"
            title="Account menu"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[#d2f54a] text-[11px] font-bold text-[#16214b]">
              {initials(user?.name)}
            </div>

            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold text-white">
                {user?.name}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {user?.role}
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`text-slate-300 transition-transform ${
                profileMenuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {profileMenuOpen && (
            <div
              id="profile-menu"
              className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg shadow-slate-950/10"
            >
              <NavLink
                to={ticketsPath}
                onClick={() => setProfileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-[#3155ff] ${
                    isActive
                      ? "bg-blue-50 text-[#3155ff]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#3155ff]"
                  }`
                }
              >
                <Ticket size={15} aria-hidden="true" />
                {ticketsLabel}
              </NavLink>

              <NavLink
                to={settingsPath}
                onClick={() => setProfileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-[#3155ff] ${
                    isActive
                      ? "bg-blue-50 text-[#3155ff]"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#3155ff]"
                  }`
                }
              >
                <Settings size={15} aria-hidden="true" />
                Settings & signature
              </NavLink>

              <button
                type="button"
                onClick={openPasswordDialog}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#3155ff] focus-visible:outline-2 focus-visible:outline-[#3155ff]"
              >
                <UserRound size={15} aria-hidden="true" />
                Update profile
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-[#3155ff]"
              >
                <LogOut size={15} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {logoutError && (
          <p
            role="alert"
            className="absolute right-4 top-full mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow"
          >
            {logoutError}
          </p>
        )}
      </header>

      <Dialog
        open={passwordDialogOpen}
        onOpenChange={handlePasswordDialogOpenChange}
      >
        <DialogContent
          showCloseButton={!isChangingPassword}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            profileButtonRef.current?.focus();
          }}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>
              Update your name or change your password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-name"
                className="text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {profileError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {profileError}
              </p>
            )}

            {profileMessage && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                {profileMessage}
              </p>
            )}

            <DialogFooter>
              <button
                type="submit"
                disabled={isUpdatingProfile || profileName.trim().length === 0}
                className="rounded-lg bg-[#3155ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isUpdatingProfile ? "Saving…" : "Save name"}
              </button>
            </DialogFooter>
          </form>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Change password
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Changing your password signs out all devices.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="current-password"
                className="text-sm font-medium text-slate-700"
              >
                Current password
              </label>

              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-sm font-medium text-slate-700"
              >
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#3155ff] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {passwordChangeError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {passwordChangeError}
              </p>
            )}

            <DialogFooter className="pt-1">
              <button
                type="button"
                onClick={closePasswordDialog}
                disabled={isChangingPassword}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-lg bg-[#3155ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isChangingPassword ? "Updating…" : "Update password"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
