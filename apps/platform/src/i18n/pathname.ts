export function withLocalePath(path: string, locale: string) {
  return locale === "en" ? path : `/${locale}${path}`;
}
