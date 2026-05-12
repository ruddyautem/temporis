// client.ts
import { treaty } from "@elysia/eden";
import type { app } from "../app/api/[[...slugs]]/route";

// Always use HTTP — Eden Treaty handles routing on both sides
export const client = treaty<typeof app>("http://localhost:3000").api;
