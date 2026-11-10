"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { SessionUser, SavedKey } from "@/lib/contracts";
import { request } from "@/lib/client";
const Context = createContext<{
  user: SessionUser;
  keys: SavedKey[];
  refresh: () => Promise<void>;
} | null>(null);
export default function WorkspaceProvider({
  user: initialUser,
  keys: initialKeys,
  children,
}: {
  user: SessionUser;
  keys: SavedKey[];
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);
  const [keys, setKeys] = useState(initialKeys);
  async function refresh() {
    const data = await request<{ user: SessionUser; keys: SavedKey[] }>(
      "/api/auth",
    );
    if (!data.user) {
      location.assign("/login");
      return;
    }
    setUser(data.user);
    setKeys(data.keys);
  }
  return (
    <Context.Provider value={{ user, keys, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace context is missing.");
  return value;
}
