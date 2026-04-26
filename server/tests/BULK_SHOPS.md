# Bulk Shop Creation

This Playwright setup creates owner shops through the real backend API and uploads files from `server/shop-images`.

## Run

From `server`:

```powershell
$env:BULK_OWNER_EMAIL="owner@example.com"
$env:BULK_OWNER_PASSWORD="your-password"
npm.cmd run bulk:create-shops
```

The Playwright config starts `npm run start` automatically. If your server is already running, Playwright reuses it.

## Optional Settings

```powershell
$env:BULK_SERVER_URL="http://localhost:8000"
$env:BULK_SHOP_LIMIT="10"
$env:BULK_SHOP_PREFIX="Demo"
$env:BULK_SHOP_CITY="Peshawar"
$env:BULK_SHOP_STATE="KPK"
$env:BULK_SKIP_EXISTING="true"
$env:BULK_UPDATE_EXISTING="true"
$env:BULK_TIMEOUT_MS="900000"
$env:BULK_UPLOAD_TIMEOUT_MS="90000"
```

`BULK_SKIP_EXISTING` defaults to `true`. `BULK_UPDATE_EXISTING` also defaults to `true`, so rerunning the script updates city/state/address for matching shops instead of uploading duplicate images.

## Custom Shop Data

Edit `server/tests/fixtures/bulk-shops.json` to control exact shop names, cities, states, addresses, and image filenames.

If there are more images than fixture rows, the test auto-generates details for the remaining images.
