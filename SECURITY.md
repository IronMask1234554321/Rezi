# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes       |

## Reporting Vulnerabilities

Preferred: use GitHub Security Advisories.

If you cannot use Security Advisories, open a GitHub issue requesting private contact.

## Scope

Security issues in Rezi include:

- Memory safety or UB in the native addon (`@rezi-ui/native`)
- Incorrect bounds checks or unsafe behavior in binary parsers/builders (ZRDL/ZREV)
- Denial of service via untrusted inputs (events, text, layout)
- Supply chain issues in the publish/release pipeline

Out of scope:

- Issues in third-party terminals or Node itself
- Vulnerabilities in applications built on Rezi (app-specific logic)

