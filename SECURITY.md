# Security Policy

## Reporting Security Vulnerabilities

We take security and user privacy seriously. If you discover a vulnerability in Docyo, please report it privately:

- **Email:** [Subhashmalik1000@gmail.com](mailto:Subhashmalik1000@gmail.com)
- **GitHub:** Use GitHub Private Vulnerability Reporting on [subhashmalik0001/Docyo](https://github.com/subhashmalik0001/Docyo/security/advisories).

Please include:
1. Description of the vulnerability and affected component (macOS native or Desktop Qt edition).
2. Steps to reproduce or a safe, synthetic proof of concept.
3. Impact assessment.

Please do not disclose vulnerabilities publicly before a fix has been coordinated and released.

---

## Security Architecture & Guarantees

Docyo is built on strict local-first and privacy principles:

1. **Local-First Processing:**
   - No cloud uploads, telemetry, external analytics, or mandatory accounts.
   - All conversions, image manipulations, and document operations execute strictly on your local computer.
2. **Non-Destructive File Operations:**
   - Input files are read-only during conversion and are never deleted, overwritten, or modified in place.
   - Outputs are published using exclusive, collision-resistant naming (`filename-converted.ext`, `filename-converted-2.ext`, etc.).
   - Atomic staging prevents partially converted or corrupt outputs from replacing valid files.
3. **Execution Isolation:**
   - Long-running conversion jobs on macOS run on detached background tasks off the main UI thread.
   - The desktop Python edition isolates batch jobs into dedicated child processes with execution timeouts.
   - Path traversal prevention: archive extractions and filesystem outputs are strictly bounded to target directories.
   - External processes (e.g. FFmpeg) receive literal argument arrays rather than shell strings, avoiding command-injection vulnerabilities.
4. **Diagnostics and Privacy:**
   - Normal operation produces zero permanent logging.
   - Opt-in diagnostics (`DOCYO_DEBUG=1`) store local logs in a user-temporary directory. These logs may contain filenames and paths; inspect before sharing.
