# Security Policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's **Security → Report a vulnerability** (private advisory) on this repository. Include affected version, reproduction steps and impact. We aim to acknowledge reports within a few days.

## Supported versions

Only the latest release receives security fixes.

## Security notes for users

- NATSBox stores saved connections, including any tokens, passwords or NKey seeds you enter, on your local machine.
- Unticking **Verify Server Certificate** disables TLS validation. Use it for local testing only.
- Load tests generate real traffic; do not target servers you do not own.
- Release assets are published with `SHA256SUMS.txt`; verify downloads before running them.
