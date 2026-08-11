# Personal mapping schema

A `ShopMapping` contains shop identity, exact domain family, deterministic page rules, declarative control mappings, source, version, health, and timestamps.

Each `ControlMapping` contains personal attribute codes or the default sort source, a whitelisted control kind, ordered locator-plus-fingerprint strategies, optional trigger/option/Save configuration, explicit deterministic value matching, dependencies, and bounded verification rules.

Supported control kinds are `CHECKBOX`, `SELECT`, `INPUT`, `CLICK`, and `OPTION_GROUP`. Supported matching is `EXACT`, `NORMALIZED_EXACT`, `NUMERIC`, and `LOOKUP_TABLE`. Imports reject executable strings, unsupported operations, excessive selector counts, unsafe domain forms, and timeouts above the local engine limit.
