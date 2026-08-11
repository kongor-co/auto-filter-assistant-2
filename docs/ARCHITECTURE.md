# AutoFilter architecture

The popup edits a versioned local profile and sends an explicit Apply command through the Manifest V3 service worker. The packaged Zalando content script validates that the current page is a product listing, groups the two canonical size preferences into Zalando's Size filter, applies enabled Colour, Brand, and Material values, and handles sorting separately.

Every interaction follows the same sequence: resolve the predefined accessible locator, validate expected expanded-state capability, open the named dialog, resolve exact named inputs, compare current state, interact only when necessary, use the dialog's explicit Save control, and wait for relevant product-list mutations to settle. Missing options are reported and never substituted.

Automatic mode uses the same engine. A session key tied to the listing URL prevents navigation-triggered duplicate execution. Core operation does not require a backend.
