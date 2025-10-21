# Email deliverability & security notes

Essential steps to protect deliverability and defend against phishing.

1) DNS records
- SPF: Add an SPF record that authorizes your sending services (e.g., SendGrid, SES).
- DKIM: Configure DKIM for your email provider; publish DKIM public keys in DNS.
- DMARC: Publish a DMARC record for monitoring (p=none initially), then move to quarantine/reject after verification.

2) Use a transactional email provider
- Use SendGrid, Amazon SES, Mailgun, or similar. Use dedicated subdomains (e.g., mail.yuck.example) for transactional email to separate reputation.

3) Authentication & monitoring
- Monitor DMARC reports and set up alerts.
- Use TLS for SMTP and enforce strong authentication on admin consoles.

4) User verification
- Require email verification for invite requests and deliver invite tokens only after verifying payment and email.
