const LIST_ID = "RmRRvH";
const REVISION = "2025-04-15";
const BASE_URL = "https://a.klaviyo.com/api";

function headers() {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key) throw new Error("KLAVIYO_API_KEY is not set");
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    "Content-Type": "application/vnd.api+json",
    Accept: "application/vnd.api+json",
    revision: REVISION,
  };
}

/**
 * Creates or updates a Klaviyo profile, then subscribes the email address
 * to the marketing list. Skips silently if KLAVIYO_API_KEY is absent.
 *
 * Must only be called after explicit opt-in (marketingOptIn === true).
 */
export async function subscribeToMarketingList(params: {
  email: string;
  firstName?: string;
}): Promise<void> {
  if (!process.env.KLAVIYO_API_KEY) return;

  const h = headers();

  // ── Step 1: Create or update profile ────────────────────────────────────
  const profileRes = await fetch(`${BASE_URL}/profiles`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      data: {
        type: "profile",
        attributes: {
          email: params.email,
          ...(params.firstName ? { first_name: params.firstName } : {}),
        },
      },
    }),
  });

  // 409 = profile already exists — safe to continue to subscription step
  if (!profileRes.ok && profileRes.status !== 409) {
    const body = await profileRes.text();
    throw new Error(`Klaviyo profile upsert failed (${profileRes.status}): ${body}`);
  }

  // ── Step 2: Subscribe to list ────────────────────────────────────────────
  const subRes = await fetch(`${BASE_URL}/profile-subscription-bulk-create-jobs`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: params.email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED",
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: { type: "list", id: LIST_ID },
          },
        },
      },
    }),
  });

  if (!subRes.ok) {
    const body = await subRes.text();
    throw new Error(`Klaviyo subscription failed (${subRes.status}): ${body}`);
  }
}
