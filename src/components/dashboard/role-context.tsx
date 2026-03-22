"use client";

import { createContext, useContext } from "react";

export type Role = "OWNER" | "ADMIN" | "MEMBER";

type RoleContextType = {
  role: Role;
  canManage: boolean;
};

const RoleContext = createContext<RoleContextType>({
  role: "MEMBER",
  canManage: false,
});

export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const canManage = role === "OWNER" || role === "ADMIN";
  return (
    <RoleContext.Provider value={{ role, canManage }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
