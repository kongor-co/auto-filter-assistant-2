# Architecture

The versioned local state contains the user profile, per-shop settings, personal mappings, pending picker result, mapping health, and last execution result. Packaged official mappings and local personal mappings are resolved by normalized hostname and deterministic page rules.

Manual execution injects the packaged content runtime under temporary `activeTab` access. Automatic execution requests an optional origin permission and registers the same packaged runtime for that shop. The engine resolves stored selector strategies, validates fingerprints, reads current state, interacts only when necessary, and runs configured verification and listing-stabilization rules.

Personal controls can override an official control by `overridesControlId`; otherwise personal and official controls are combined. Runtime mapping strings are never executed as code.
