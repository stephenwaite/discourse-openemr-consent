# OpenEMR Analytics Consent

A Discourse theme component for community.open-emr.org. It loads Google Analytics 4 only after a visitor clicks **Accept**, matching the OpenEMR privacy policy at https://www.open-emr.org/privacy/ and the consent banner on www.open-emr.org and its wiki.

- **No GA before consent.** No Google script loads until the visitor clicks Accept. The choice is remembered in the browser.
- **Minimal Google tracking.** Google signals and ad personalization are turned off in the tag.
- **Token pages are protected.** GA never loads on password-reset, account-activation, email-confirmation, email-login or invite pages, because their URLs contain secret tokens.
- **Admins aren't counted.** Logged-in admins get no banner and no GA.
- **Visitors can change their mind.** Any link ending in `#cookie-settings` reopens the banner. Withdrawing consent deletes the `_ga` cookies.

## Install

1. In **Admin → Appearance → Themes & components → Components**, choose **Install → From a Git repository** and enter `https://github.com/stephenwaite/discourse-openemr-consent`.
2. Add the component to every theme visitors can use (at least the default theme).
3. **Turn off Discourse's built-in Google Analytics.** Otherwise GA keeps loading for everyone without consent. In **Admin → Settings**, clear `ga_universal_tracking_code` (this also removes the old UA code) and, if set, `gtm_container_id`.
4. **Add a "Cookie settings" link** where visitors can find it. For example, add a custom sidebar link or a link in the site footer or About page, pointing to `https://community.open-emr.org/#cookie-settings`.

The component's settings default to the shared GA4 ID `G-6ZX96L7J8J` and the Foundation privacy policy. They also add `https://www.googletagmanager.com` to Discourse's content security policy so the GA script can load.

Discourse doesn't reload the page as people navigate, so page views after the first one rely on GA4's **enhanced measurement**. Keep **Admin → Data streams → (web stream) → Enhanced measurement → Page views → "Page changes based on browser history events"** turned on (it's on by default).

## Check it works

1. Open the forum in a private window, logged out. The banner should appear, and DevTools → Network should show no requests to `googletagmanager.com`.
2. Click **Decline**. Nothing should load. Reload, and the banner should stay hidden.
3. Open `/#cookie-settings`, then click **Accept**. `gtag/js?id=G-6ZX96L7J8J` should load, and you should appear in GA4 **Realtime** with hostname `community.open-emr.org`.
4. Log in as an admin. No banner, no GA.

## Testing done

The consent logic in `javascripts/discourse/lib/analytics-consent.js` was tested in jsdom (15 checks). These covered:
- first visit, Accept and Decline, and returning visitors;
- not loading GA twice when navigating;
- no GA or banner on token pages, and GA loading after leaving a token page;
- the `#cookie-settings` link and URL;
- withdrawing consent, which clears `_ga` cookies, keeps others and reloads;
- blocked browser storage.

The SCSS compiles, and the settings and metadata files parse. **It hasn't been run inside a real Discourse instance**, so try it on a test theme first.

## License

GNU General Public License v3.0, the same license as OpenEMR. See [LICENSE](LICENSE).
