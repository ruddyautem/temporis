// src/lib/client.ts
import { treaty } from "@elysia/eden";
import type { app } from "../app/api/[[...slugs]]/route";

const getBaseUrl = () => {
  // 1. Browser: Automatically grabs https://temporis.autem.dev (or localhost in dev)
  if (typeof window !== "undefined") return window.location.origin;
  
  // 2. Server (SSR): Uses the environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  
  // 3. Fallback
  return "http://localhost:3000";
};

// Initialize Eden client
export const client = treaty<typeof app>(getBaseUrl()).api;