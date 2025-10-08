# Security Policy

## Supported Versions

We provide security updates for the following versions of PressBox:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The PressBox team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@pressbox.dev**

If you prefer to encrypt your email, please use our PGP key:

```
[PGP KEY WOULD GO HERE IN PRODUCTION]
```

### What to Include

When reporting a vulnerability, please include the following information:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **The location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit the issue

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity within 5 business days
- **Fix Development**: Critical vulnerabilities will be prioritized for immediate fixes
- **Disclosure**: We will coordinate with you on the disclosure timeline

### Severity Guidelines

We use the following severity levels for security vulnerabilities:

#### Critical

- Remote code execution
- SQL injection with data access
- Authentication bypass
- Privilege escalation to admin/system level

#### High

- Cross-site scripting (XSS) with significant impact
- Local privilege escalation
- Information disclosure of sensitive data
- CSRF with significant impact

#### Medium

- Information disclosure of non-sensitive data
- Denial of service attacks
- CSRF with limited impact
- Local information disclosure

#### Low

- Information disclosure with minimal impact
- Issues requiring significant user interaction
- Security misconfigurations with limited impact

## Security Best Practices

### For Users

1. **Keep PressBox Updated**: Always use the latest version with security patches
2. **Secure Docker**: Ensure Docker Desktop is updated and properly configured
3. **Network Security**: Use PressBox on trusted networks when possible
4. **File Permissions**: Set appropriate file permissions for WordPress sites
5. **Regular Backups**: Maintain regular backups of your development sites

### For Developers

1. **Input Validation**: Validate all user inputs and IPC messages
2. **Secure IPC**: Use context isolation and validate all inter-process communication
3. **Dependency Management**: Keep dependencies updated and audit for vulnerabilities
4. **Secret Management**: Never commit secrets, API keys, or passwords
5. **Code Review**: All code changes should be reviewed for security implications

## Known Security Considerations

### Electron Security

PressBox follows Electron security best practices:

- **Context Isolation**: Enabled to prevent code injection
- **Node Integration**: Disabled in renderer processes
- **Remote Module**: Not used (deprecated)
- **Content Security Policy**: Implemented where applicable
- **Secure Preload**: All IPC communication goes through secure preload scripts

### Docker Integration

- **Container Isolation**: WordPress sites run in isolated Docker containers
- **Network Security**: Containers use isolated Docker networks
- **Volume Mounts**: Limited to necessary directories only
- **Privilege Dropping**: Containers run with minimal required privileges

### File System Access

- **Sandboxing**: File system access is limited to necessary directories
- **Path Validation**: All file paths are validated to prevent directory traversal
- **Permission Checks**: Appropriate permission checks before file operations

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow a coordinated disclosure policy:

1. **Report received** and acknowledged within 48 hours
2. **Vulnerability assessed** and severity determined
3. **Fix developed** and tested internally
4. **Security advisory** prepared
5. **Fix released** to users
6. **Public disclosure** coordinated with reporter (typically 90 days after fix)

### Recognition

We maintain a security hall of fame to recognize researchers who help improve PressBox security:

- Security researchers who report valid vulnerabilities will be acknowledged
- Recognition includes name and affiliation (if desired)
- Particularly impactful findings may receive additional recognition

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service
- Only interact with accounts you own or with explicit permission of the account holder
- Do not access, modify, or delete data belonging to others
- Report vulnerabilities promptly once discovered
- Do not exploit vulnerabilities beyond what is necessary to demonstrate the issue

## Security Contact

- **Email**: security@pressbox.dev
- **Response Time**: Within 48 hours for security issues
- **PGP Key**: Available on request

## Scope

This security policy applies to:

- PressBox desktop application (all platforms)
- Official PressBox repositories on GitHub
- PressBox build and distribution infrastructure

This policy does not cover:

- Third-party plugins or extensions
- User-created content or configurations
- Issues in dependencies (report to respective maintainers)
- Social engineering attacks
- Physical security issues

## Security Updates

Security updates are released as:

- **Patch releases** for non-breaking security fixes (e.g., 1.0.1)
- **Minor releases** for security fixes requiring minor changes (e.g., 1.1.0)
- **Major releases** for security fixes requiring breaking changes (e.g., 2.0.0)

Critical security fixes may be backported to supported versions.

## Additional Resources

- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [WordPress Security](https://wordpress.org/support/article/hardening-wordpress/)

---

**Thank you for helping keep PressBox and our users safe!**

_Last updated: October 8, 2025_
