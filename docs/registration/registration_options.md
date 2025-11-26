# Registration Concepts for RangerPlex AI

Goal: Let a user “register” with an email, receive a code, and unlock a fun “Registered” sticker/badge. Below are several implementation paths with pros/cons so you can pick what fits your needs and risk tolerance.

## Option A: In-App Registration (No Email Sending)
- **How it works**: User enters email → server generates a short code → stores email+code+timestamp in SQLite → shows the code in the UI + unlocks a sticker.
- **Pros**:
  - No external services or keys required.
  - Works offline/local; no delivery failures.
  - Easiest to implement and test.
  - No email provider cost.
- **Cons**:
  - User must copy the code manually (no email delivery).
  - Not a strong verification (no proof they own the email unless you add a confirm step).
  - Emails are stored locally; if you sync, be mindful of privacy.

## Option B: Email Delivery via SMTP
- **How it works**: Collect email → generate code → send via SMTP (e.g., Gmail SMTP app password, Fastmail, etc.) → store email+code in SQLite → user enters code to unlock sticker.
- **Pros**:
  - Simple to wire with nodemailer; no third-party API.
  - User gets code in their inbox (better verification UX).
  - You control deliverability via your SMTP reputation.
- **Cons**:
  - Requires SMTP credentials (sensitive; must be secured).
  - Deliverability can suffer if not configured (SPF/DKIM).
  - May hit provider rate limits; risk of account flags if abused.
  - Need to guard against abuse (CAPTCHA/rate limiting) if exposed publicly.

## Option C: Email Delivery via Transactional API (SendGrid/Mailgun/SES/Postmark)
- **How it works**: Collect email → generate code → call provider API to send → store email+code in SQLite → user enters code to unlock sticker.
- **Pros**:
  - Better deliverability tools, dashboards, logs.
  - Easier scaling and error handling.
  - Usually simpler than DIY SMTP for production.
  - API keys can be scoped; less risk than full mailbox creds.
- **Cons**:
  - Requires API keys and account setup; some providers need domain verification.
  - Paid tiers after free trial; quotas/limits apply.
  - Same abuse considerations if public (add rate limiting/CAPTCHA).

## Option D: Deferred Verification (No Immediate Send)
- **How it works**: Collect email → store it → show “We’ll send your code soon” but do not send immediately (manual batch or later automation).
- **Pros**:
  - Zero integration effort initially.
  - Lets you collect interest without email infra ready.
  - No exposure of mail keys in the app.
- **Cons**:
  - Delayed gratification; users may bounce.
  - You must follow up manually or build a batch sender later.

## Data Model & Storage (for all options)
- Add `registrations` table (email, code, created_at, verified_at, status, notes).
- Store stickers/unlock state in settings/user profile (e.g., `is_registered`, `registration_code`, `registration_time`).
- Keep PII minimal; consider hashing emails if you only need uniqueness (but then you can’t email them without storing the real email somewhere).

## UX Ideas (Sticker + Flows)
- “Register” button opens a modal: email input → generate/send code → display code (Option A) or prompt to check email (Options B/C).
- “Enter code” field to mark as verified; on success, show a “Registered” sticker/badge near avatar/header.
- Add “Copy code” button and a small “Sent to: user@example.com” line.
- Make it clear that emails are stored locally and not shared; link to a short privacy blurb.

## Security & Abuse Considerations
- Add basic rate limiting (per IP/per email) if you expose registration publicly.
- Avoid logging raw email contents in server logs.
- Keep SMTP/API keys in `.env`; do not commit.
- If using public demo, consider CAPTCHA to prevent spamming your mail provider.

## Suggested MVP Path
- Start with **Option A (In-App Registration)** to validate UX quickly:
  - Add a `/api/register` POST that stores email+code+timestamp in SQLite and returns the code.
  - Add a `/api/verify` POST that accepts email+code and marks verified.
  - Show the code in the UI and unlock the sticker immediately after verification.
  - Keep API keys out of scope for the first iteration.
- Then, if you want real emails, layer in **Option B (SMTP)** or **Option C (API)** by swapping the “send” step to call nodemailer or a provider SDK, controlled via `.env` flags (e.g., `REGISTRATION_MODE=in_app|smtp|api`).

## Links / Quick Start for Email APIs
- SendGrid: https://docs.sendgrid.com/for-developers/sending-email/api-getting-started
- Mailgun: https://documentation.mailgun.com/en/latest/quickstart-sending.html
- SES: https://docs.aws.amazon.com/ses/latest/dg/send-email-set-up.html
- Postmark: https://postmarkapp.com/developer/api/overview
***
