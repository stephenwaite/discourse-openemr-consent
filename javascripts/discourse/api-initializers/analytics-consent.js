import { apiInitializer } from "discourse/lib/api";
import { createConsent } from "../lib/analytics-consent";

export default apiInitializer("1.8.0", (api) => {
  const gaId = (settings.ga4_measurement_id || "").trim();
  if (!gaId) {
    return;
  }

  // Keep admin activity out of the numbers, matching the wiki.
  if (api.getCurrentUser()?.admin) {
    return;
  }

  const consent = createConsent({
    gaId,
    privacyUrl: settings.privacy_policy_url,
  });
  consent.start();
  api.onPageChange(() => consent.onPageChange());
});
