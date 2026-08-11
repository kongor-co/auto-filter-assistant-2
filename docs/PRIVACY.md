# Privacy and permissions

Profiles, mappings, diagnostics, and settings stay in `chrome.storage.local`. There is no account, backend, analytics, telemetry, AI service, or remote mapping execution.

Manual application and mapping use Chrome's temporary `activeTab` permission. Automatic execution is opt-in per shop and requests an optional host permission for that domain only. Revoking the permission disables automatic use and marks affected personal mappings as requiring permission.
