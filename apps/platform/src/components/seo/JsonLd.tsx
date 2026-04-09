"use client";

import { useServerInsertedHTML } from "next/navigation";

/**
 * Injects a JSON-LD <script> block during server-side rendering.
 * Using useServerInsertedHTML ensures the script is emitted into the HTML
 * stream even when this component is nested inside a "use client" boundary
 * (e.g. AppLayout), avoiding the React 19 dangerouslySetInnerHTML validation
 * error that occurs when plain <script> elements are rendered inside client
 * component subtrees.
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  const html = JSON.stringify(schema);
  useServerInsertedHTML(() => (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ));
  return null;
}
