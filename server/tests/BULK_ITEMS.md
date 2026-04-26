# Bulk Item Creation

This Playwright setup creates menu items through the real backend API and uploads files from `server/items-images`.

## Run

From `server`:

```powershell
npm.cmd run bulk:create-items
```

It uses the same owner credentials and server URL as the shop seeder:

```powershell
BULK_OWNER_EMAIL="owner@example.com"
BULK_OWNER_PASSWORD="your-password"
BULK_SERVER_URL="http://localhost:8000"
```

## Optional Settings

```powershell
$env:BULK_ITEM_SHOPS="Noodle House,Homie Veg,Pizza Hub,Burger Bites"
$env:BULK_ITEMS_PER_SHOP="15"
$env:BULK_UPDATE_EXISTING_ITEMS="true"
$env:BULK_ITEMS_TIMEOUT_MS="1200000"
$env:BULK_ITEM_UPLOAD_TIMEOUT_MS="90000"
```

The default target shops are exactly `Noodle House`, `Homie Veg`, `Pizza Hub`, and `Burger Bites`.
