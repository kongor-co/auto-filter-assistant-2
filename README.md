# AutoFilter 3

AutoFilter stores personal shopping attributes and applies them through deterministic official or user-created webshop mappings. It uses no AI, remote code, or semantic guessing.

## Custom mapping workflow

1. Open a normal HTTP/HTTPS product-listing page.
2. Open AutoFilter and choose **Map a filter on this shop**.
3. Hover the page and select the filter control. Press Escape to cancel.
4. Reopen AutoFilter. The guided mapper resumes automatically.
5. Choose the personal attribute, control type, supported path, optional listing selector, and any explicit profile-to-site value translations.
6. Choose **Test mapping**. Saving is unavailable until the test passes.
7. Save the personal mapping. Manual use continues through temporary `activeTab` access.
8. Optionally enable automatic use; Chrome then requests persistent access only for that shop.

The initial guided mapper supports native checkboxes/switches, selects, inputs, buttons/chips, and advanced option groups. Complex sites may require an explicit option selector, Save selector, or listing selector.

## Safety model

- Mappings are declarative JSON interpreted by a packaged, whitelisted engine.
- Every locator is paired with a structural fingerprint.
- Unknown values are unavailable, never guessed or substituted.
- Checkout, cart, login, account, and payment path patterns are excluded from generated mappings.
- Imported mappings are schema-validated and marked untested.
- Repeated failures degrade and eventually break a personal mapping.
- Automatic mode uses optional per-domain host permission.

## Install

```powershell
pnpm install
pnpm test
pnpm build
```

Open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose either this repository or its `dist` directory.

## Package

```powershell
pnpm package
```

This creates `autofilter-extension.zip`.

See [architecture](docs/ARCHITECTURE.md), [mapping schema](docs/MAPPING_SCHEMA.md), and [privacy](docs/PRIVACY.md).
