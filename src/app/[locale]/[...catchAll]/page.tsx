import { notFound } from "next/navigation";

/**
 * Catch-all route for unmatched paths
 * This ensures that the not-found.tsx page is shown for any unmatched route
 * within the locale segment (e.g., /en/something-random)
 */
export default function CatchAllPage() {
  notFound();
}
