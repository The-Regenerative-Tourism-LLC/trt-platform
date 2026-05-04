"use client";

/**
 * Clicking this link resets the consent cookie to force the banner to re-appear.
 */
export function CookiePreferencesLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Delete the consent cookie by setting max-age=0
    document.cookie = "trt_consent=; max-age=0; path=/; SameSite=Lax";
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="underline hover:text-foreground text-black text-left"
    >
      Update cookie preferences
    </button>
  );
}
