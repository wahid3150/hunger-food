// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(serverRoot, 'shop-images');
const fixturePath = path.join(__dirname, 'fixtures', 'bulk-shops.json');

const serverUrl =
  process.env.BULK_SERVER_URL ||
  process.env.SERVER_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

const ownerEmail = process.env.BULK_OWNER_EMAIL || process.env.OWNER_EMAIL;
const ownerPassword = process.env.BULK_OWNER_PASSWORD || process.env.OWNER_PASSWORD;
const shopPrefix = process.env.BULK_SHOP_PREFIX || 'Bulk';
const defaultCity = process.env.BULK_SHOP_CITY || 'Peshawar';
const defaultState = process.env.BULK_SHOP_STATE || 'KPK';
const skipExisting = process.env.BULK_SKIP_EXISTING !== 'false';
const updateExisting = process.env.BULK_UPDATE_EXISTING !== 'false';
const limit = Number(process.env.BULK_SHOP_LIMIT || 0);
const bulkTimeoutMs = Number(process.env.BULK_TIMEOUT_MS || 15 * 60 * 1000);
const uploadTimeoutMs = Number(process.env.BULK_UPLOAD_TIMEOUT_MS || 90 * 1000);

const peshawarAddresses = [
  'Shop 12, Saddar Road, near Dean Trade Center, Saddar Bazaar, Peshawar',
  'Shop 8, Food Street, near Islamia College Road, University Town, Peshawar',
  'Shop 5, Phase 3 Chowk, Hayatabad, Peshawar',
  'Shop 17, Main Jamrud Road, near Hayatabad Medical Complex, Peshawar',
  'Shop 21, Hashtnagri Bazaar, near Hashtnagri Bus Stop, Peshawar',
  'Shop 4, Warsak Road, near Warsak Model School, Peshawar',
  'Shop 9, Ring Road, near Achini Chowk, Peshawar',
  'Shop 14, Karkhano Market, near Hayatabad Phase 7, Peshawar',
  'Shop 2, Qissa Khwani Bazaar, Old City, Peshawar',
  'Shop 6, Chowk Yadgar, near Clock Tower, Peshawar',
  'Shop 19, Board Bazaar, Jamrud Road, Peshawar',
  'Shop 7, Tehkal Payan, University Road, Peshawar',
  'Shop 11, Gulbahar Road, near Gulbahar Police Station, Peshawar',
  'Shop 3, Faqirabad Road, near Faqirabad Chowk, Peshawar',
  'Shop 16, Dalazak Road, near City Hospital, Peshawar',
  'Shop 10, Charsadda Road, near Bacha Khan Chowk, Peshawar',
  'Shop 24, Kohat Road, near Scheme Chowk, Peshawar',
  'Shop 1, G.T. Road, near Haji Camp Adda, Peshawar',
  'Shop 13, Nishtarabad, near Nishtar Hall Road, Peshawar',
  'Shop 18, Shami Road, near Peshawar Cantt, Peshawar',
  'Shop 22, Abdara Road, University Town, Peshawar',
  'Shop 15, Arbab Road, University Town, Peshawar',
  'Shop 20, Canal Road, near Hayatabad Phase 2, Peshawar',
  'Shop 23, Regi Model Town, Peshawar',
  'Shop 26, Nasir Bagh Road, Peshawar',
  'Shop 25, Hayatabad Phase 6 Market, Peshawar',
  'Shop 27, University Road, near Tahkal Bala, Peshawar',
  'Shop 28, Saddar Bazaar, near Railway Station Road, Peshawar',
  'Shop 29, Warsak Road, near Mathra Chowk, Peshawar',
  'Shop 30, Khyber Bazaar, near Kabuli Gate, Peshawar',
];

const defaultNames = [
  'Spicy Kitchen',
  'Burger Junction',
  'Tandoori Flames',
  'Pizza Palace',
  'Biryani House',
  'Grill Master',
  'Noodle Corner',
  'Fresh Bites',
  'Desi Dhaba',
  'Cafe Aroma',
  'Urban Meals',
  'Food Fiesta',
  'Royal Karahi',
  'Snack Station',
  'Rice Bowl',
  'The Sandwich Bar',
  'Hot Pot Express',
  'BBQ Tonight',
  'Taste Factory',
  'Crunchy Chicken',
  'Wrap World',
  'Sweet Treats',
  'Sizzler Spot',
  'Family Foods',
  'Lunch Box',
  'Street Eats',
  'Golden Spoon',
  'Meal Market',
  'Kitchen Story',
  'Flavour Hub',
  'Quick Cravings',
  'Curry Castle',
  'Food Lounge',
  'Deli Garden',
  'Munch Point',
  'Hungry Hub',
  'Taste Town',
  'Peshawar Bites',
  'Peshawar Grill',
  'Khyber Foods',
  'Namkeen Cafe',
  'Qissa Khwani Kitchen',
];

/** @param {string} a @param {string} b */
const naturalSort = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/** @param {string} fileName */
const imageMimeType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

/** @param {string} name */
const fitShopName = (name) => name.trim().replace(/\s+/g, ' ').slice(0, 30).trim();

/**
 * @typedef {Object} ShopFixture
 * @property {string=} name
 * @property {string=} city
 * @property {string=} state
 * @property {string=} address
 * @property {string=} image
 */

/**
 * @typedef {Object} ShopRow
 * @property {string} name
 * @property {string} city
 * @property {string} state
 * @property {string} address
 * @property {string} image
 */

/** @returns {ShopFixture[]} */
const readFixtureRows = () => {
  if (!fs.existsSync(fixturePath)) return [];
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    throw new Error(`${fixturePath} must contain a JSON array.`);
  }
  return rows;
};

/** @returns {ShopRow[]} */
const buildShopRows = () => {
  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Missing image directory: ${imagesDir}`);
  }

  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort(naturalSort);

  if (!imageFiles.length) {
    throw new Error(`No JPG, PNG, or WEBP files found in ${imagesDir}`);
  }

  const fixtureRows = readFixtureRows();
  const rows = imageFiles.map((imageFile, index) => {
    const fixture = fixtureRows[index] || {};
    const baseName = defaultNames[index] || `Food Spot ${index + 1}`;
    const city = fixture.city || defaultCity;
    const state = fixture.state || defaultState;

    return {
      name: fitShopName(fixture.name || `${shopPrefix} ${baseName}`),
      city: fixture.city || city,
      state: fixture.state || state,
      address:
        fixture.address ||
        peshawarAddresses[index % peshawarAddresses.length],
      image: fixture.image || imageFile,
    };
  });

  return limit > 0 ? rows.slice(0, limit) : rows;
};

test.describe.configure({ mode: 'serial' });

test('bulk create owner shops from shop-images', async ({ request }) => {
  test.setTimeout(bulkTimeoutMs);

  expect(ownerEmail, 'Set BULK_OWNER_EMAIL or OWNER_EMAIL before running.').toBeTruthy();
  expect(ownerPassword, 'Set BULK_OWNER_PASSWORD or OWNER_PASSWORD before running.').toBeTruthy();

  const loginResponse = await request.post(`${serverUrl}/api/auth/signin`, {
    data: {
      email: ownerEmail,
      password: ownerPassword,
    },
  });

  expect(
    loginResponse.ok(),
    `Owner login failed: ${loginResponse.status()} ${await loginResponse.text()}`,
  ).toBeTruthy();

  const profileResponse = await request.get(`${serverUrl}/api/auth/current`);
  expect(
    profileResponse.ok(),
    `Could not read current user: ${profileResponse.status()} ${await profileResponse.text()}`,
  ).toBeTruthy();

  const profile = await profileResponse.json();
  expect(profile.role, `Bulk shop creation must run as an owner account.`).toBe('owner');

  const existingResponse = await request.get(`${serverUrl}/api/shop/my-shops`);
  expect(
    existingResponse.ok(),
    `Could not read existing shops: ${existingResponse.status()} ${await existingResponse.text()}`,
  ).toBeTruthy();

  const existingPayload = await existingResponse.json();
  const existingShops = /** @type {{ _id: string, name: string }[]} */ (existingPayload.shops || []);
  const existingShopsByName = new Map(existingShops.map((shop) => [shop.name, shop]));
  /** @type {Set<string>} */
  const existingNames = new Set(existingShops.map((shop) => shop.name));
  /** @type {string[]} */
  const created = [];
  /** @type {string[]} */
  const updated = [];
  /** @type {string[]} */
  const skipped = [];

  for (const shop of buildShopRows()) {
    const imagePath = path.resolve(imagesDir, shop.image);

    expect(
      imagePath.startsWith(imagesDir),
      `Image path must stay inside ${imagesDir}: ${shop.image}`,
    ).toBeTruthy();
    expect(fs.existsSync(imagePath), `Missing image for ${shop.name}: ${imagePath}`).toBeTruthy();

    const existingShop = existingShopsByName.get(shop.name);

    if (skipExisting && existingShop) {
      if (updateExisting) {
        const updateResponse = await request.put(
          `${serverUrl}/api/shop/update-shop/${existingShop._id}`,
          {
            timeout: uploadTimeoutMs,
            multipart: {
              name: shop.name,
              city: shop.city,
              state: shop.state,
              address: shop.address,
            },
          },
        );

        expect(
          updateResponse.ok(),
          `Update failed for ${shop.name}: ${updateResponse.status()} ${await updateResponse.text()}`,
        ).toBeTruthy();

        updated.push(shop.name);
        continue;
      }

      skipped.push(shop.name);
      continue;
    }

    const createResponse = await request.post(`${serverUrl}/api/shop/create-shop`, {
      timeout: uploadTimeoutMs,
      multipart: {
        name: shop.name,
        city: shop.city,
        state: shop.state,
        address: shop.address,
        image: {
          name: path.basename(imagePath),
          mimeType: imageMimeType(imagePath),
          buffer: fs.readFileSync(imagePath),
        },
      },
    });

    if (skipExisting && createResponse.status() === 409) {
      skipped.push(shop.name);
      existingNames.add(shop.name);
      continue;
    }

    expect(
      createResponse.ok(),
      `Create failed for ${shop.name}: ${createResponse.status()} ${await createResponse.text()}`,
    ).toBeTruthy();

    created.push(shop.name);
    existingNames.add(shop.name);
  }

  console.log(
    `Bulk shops complete. Created: ${created.length}. Updated: ${updated.length}. Skipped: ${skipped.length}.`,
  );
  if (created.length) console.log(`Created shops: ${created.join(', ')}`);
  if (updated.length) console.log(`Updated shops: ${updated.join(', ')}`);
  if (skipped.length) console.log(`Skipped existing shops: ${skipped.join(', ')}`);
});
