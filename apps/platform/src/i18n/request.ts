import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const loaders = {
  en: () => import("../../messages/en.json"),
  pt: () => import("../../messages/pt.json"),
  es: () => import("../../messages/es.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await loaders[locale as keyof typeof loaders]()).default;

  return { locale, messages };
});
