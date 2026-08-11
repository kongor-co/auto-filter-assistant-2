# AutoFilter

AutoFilter is a Chrome extension that stores the shopping preferences you repeatedly select and applies them instantly on supported product listings. It is inspired by the original `instant-filter` prototype and rebuilt against the AutoFilter PRD as a deterministic, local-first product.

## What works

- First-run onboarding and a polished multi-view popup.
- Personal profile for EU shoe size, clothing size, preferred colours, brands, materials, and sorting.
- Real Zalando Germany support on product-listing pages.
- Manual one-click application and optional automatic application.
- Current Zalando controls are resolved through accessible names and structural checks.
- Existing correct selections are preserved; missing values are reported instead of guessed.
- Per-filter outcomes: applied, already correct, unavailable, skipped, or failed.
- All profile data stays in `chrome.storage.local`; no account, telemetry, backend, AI, or remote code.

## Install

```powershell
pnpm install
pnpm build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select either the repository root or its `dist` directory. Both are loadable; selecting the repository root is convenient during development.

Open a listing such as `https://en.zalando.de/womens-shoes/`, configure the profile in the popup, and select **Apply my filters**.

## Verify and package

```powershell
pnpm test
pnpm package
```

The package command writes `autofilter-extension.zip` in the repository root.

## Architecture

- `src/app`: React popup, onboarding, profile, shop state, results, and settings.
- `src/domain`: versioned state, preference catalogue, and declarative Zalando mapping.
- `src/extension/background.ts`: lifecycle, active-tab coordination, and persistent results.
- `src/extension/content.ts`: page recognition, mapped interaction, state checks, verification, stabilization, and automatic-mode loop protection.

Only Zalando Germany is presented as supported. Other shops from the inspiration repository were deliberately removed because they had no validated runtime adapter.
