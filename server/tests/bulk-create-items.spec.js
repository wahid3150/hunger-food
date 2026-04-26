// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const imagesDir = path.join(serverRoot, 'items-images');

const serverUrl =
  process.env.BULK_SERVER_URL ||
  process.env.SERVER_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

const ownerEmail = process.env.BULK_OWNER_EMAIL || process.env.OWNER_EMAIL;
const ownerPassword = process.env.BULK_OWNER_PASSWORD || process.env.OWNER_PASSWORD;
const targetShopNames = (
  process.env.BULK_ITEM_SHOPS || 'Noodle House,Homie Veg,Pizza Hub,Burger Bites'
)
  .split(',')
  .map((shop) => shop.trim())
  .filter(Boolean);
const itemsPerShop = Number(process.env.BULK_ITEMS_PER_SHOP || 15);
const updateExisting = process.env.BULK_UPDATE_EXISTING_ITEMS !== 'false';
const bulkTimeoutMs = Number(process.env.BULK_ITEMS_TIMEOUT_MS || 20 * 60 * 1000);
const uploadTimeoutMs = Number(process.env.BULK_ITEM_UPLOAD_TIMEOUT_MS || 90 * 1000);

const menusByShop = {
  'Noodle House': [
    ['Chicken Chow Mein', 'noodles', 'non-veg', 480],
    ['Beef Chili Noodles', 'noodles', 'non-veg', 560],
    ['Vegetable Hakka Noodles', 'noodles', 'veg', 390],
    ['Schezwan Noodles', 'noodles', 'veg', 430],
    ['Garlic Chicken Noodles', 'noodles', 'non-veg', 520],
    ['Thai Peanut Noodles', 'noodles', 'veg', 470],
    ['Spicy Ramen Bowl', 'noodles', 'non-veg', 590],
    ['Egg Fried Noodles', 'noodles', 'non-veg', 450],
    ['Mushroom Noodle Bowl', 'noodles', 'veg', 440],
    ['Teriyaki Noodles', 'noodles', 'non-veg', 540],
    ['Hot Garlic Noodles', 'noodles', 'veg', 420],
    ['Chicken Manchurian Noodles', 'noodles', 'non-veg', 620],
    ['Sesame Veg Noodles', 'noodles', 'veg', 410],
    ['Crispy Noodle Bowl', 'noodles', 'veg', 460],
    ['Loaded Noodle Platter', 'noodles', 'non-veg', 690],
  ],
  'Homie Veg': [
    ['Veggie Rice Bowl', 'rice', 'veg', 390],
    ['Paneer Tikka Wrap', 'wrap', 'veg', 430],
    ['Garden Fresh Salad', 'salad', 'veg', 320],
    ['Mushroom Pasta', 'pasta', 'veg', 520],
    ['Crispy Veg Burger', 'burger', 'veg', 360],
    ['Chickpea Sandwich', 'sandwich', 'veg', 340],
    ['Aloo Tikki Wrap', 'wrap', 'veg', 330],
    ['Vegetable Biryani', 'rice', 'veg', 450],
    ['Creamy Corn Soup', 'other', 'veg', 280],
    ['Grilled Veg Platter', 'vegetable', 'veg', 590],
    ['Greek Veg Salad', 'salad', 'veg', 410],
    ['Cheese Veg Sandwich', 'sandwich', 'veg', 370],
    ['Spinach Pasta', 'pasta', 'veg', 490],
    ['Fruit Chaat Bowl', 'fruit', 'veg', 260],
    ['Homie Veg Thali', 'vegetable', 'veg', 650],
  ],
  'Pizza Hub': [
    ['Margherita Pizza', 'pizza', 'veg', 750],
    ['Pepperoni Pizza', 'pizza', 'non-veg', 980],
    ['Chicken Fajita Pizza', 'pizza', 'non-veg', 920],
    ['Veg Supreme Pizza', 'pizza', 'veg', 850],
    ['BBQ Chicken Pizza', 'pizza', 'non-veg', 960],
    ['Cheese Lover Pizza', 'pizza', 'veg', 790],
    ['Tikka Pizza', 'pizza', 'non-veg', 930],
    ['Mushroom Olive Pizza', 'pizza', 'veg', 870],
    ['Peri Peri Pizza', 'pizza', 'non-veg', 990],
    ['Italian Herb Pizza', 'pizza', 'veg', 820],
    ['Creamy Ranch Pizza', 'pizza', 'non-veg', 970],
    ['Spicy Beef Pizza', 'pizza', 'non-veg', 1040],
    ['Paneer Pizza', 'pizza', 'veg', 880],
    ['Four Cheese Pizza', 'pizza', 'veg', 910],
    ['Pizza Hub Special', 'pizza', 'non-veg', 1120],
  ],
  'Burger Bites': [
    ['Classic Beef Burger', 'burger', 'non-veg', 520],
    ['Crispy Chicken Burger', 'burger', 'non-veg', 480],
    ['Zinger Burger', 'burger', 'non-veg', 450],
    ['Cheese Burger', 'burger', 'non-veg', 560],
    ['Double Patty Burger', 'burger', 'non-veg', 690],
    ['Grilled Chicken Burger', 'burger', 'non-veg', 540],
    ['Mushroom Swiss Burger', 'burger', 'non-veg', 620],
    ['BBQ Beef Burger', 'burger', 'non-veg', 610],
    ['Spicy Jalapeno Burger', 'burger', 'non-veg', 580],
    ['Veggie Burger', 'burger', 'veg', 390],
    ['Fish Fillet Burger', 'burger', 'non-veg', 570],
    ['Chicken Cheese Burger', 'burger', 'non-veg', 590],
    ['Loaded Bite Burger', 'burger', 'non-veg', 730],
    ['Smoky Burger', 'burger', 'non-veg', 640],
    ['Burger Bites Special', 'burger', 'non-veg', 760],
  ],
};

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

const getImageFiles = () => {
  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Missing item image directory: ${imagesDir}`);
  }

  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort(naturalSort);

  if (!imageFiles.length) {
    throw new Error(`No JPG, PNG, or WEBP files found in ${imagesDir}`);
  }

  return imageFiles;
};

test.describe.configure({ mode: 'serial' });

test('bulk create items for selected shops from items-images', async ({ request }) => {
  test.setTimeout(bulkTimeoutMs);

  expect(ownerEmail, 'Set BULK_OWNER_EMAIL or OWNER_EMAIL before running.').toBeTruthy();
  expect(ownerPassword, 'Set BULK_OWNER_PASSWORD or OWNER_PASSWORD before running.').toBeTruthy();
  expect(targetShopNames.length, 'At least one target shop name is required.').toBeGreaterThan(0);

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

  const shopsResponse = await request.get(`${serverUrl}/api/shop/my-shops`);
  expect(
    shopsResponse.ok(),
    `Could not read owner shops: ${shopsResponse.status()} ${await shopsResponse.text()}`,
  ).toBeTruthy();

  const shopsPayload = await shopsResponse.json();
  const shops = /** @type {{ _id: string, name: string }[]} */ (shopsPayload.shops || []);
  const shopsByName = new Map(shops.map((shop) => [shop.name.toLowerCase(), shop]));
  const missingShops = targetShopNames.filter((name) => !shopsByName.has(name.toLowerCase()));

  expect(
    missingShops,
    `Missing target shops: ${missingShops.join(', ')}. Existing shops: ${shops
      .map((shop) => shop.name)
      .join(', ')}`,
  ).toHaveLength(0);

  const imageFiles = getImageFiles();
  let imageIndex = 0;
  const created = [];
  const updated = [];
  const skipped = [];

  for (const shopName of targetShopNames) {
    const shop = shopsByName.get(shopName.toLowerCase());
    const menu = menusByShop[shopName] || [];
    const selectedItems = menu.slice(0, itemsPerShop);

    expect(selectedItems.length, `No menu data configured for ${shopName}.`).toBeGreaterThan(0);
    expect(
      shop,
      `Shop ${shopName} was not found after missing-shop validation.`,
    ).toBeTruthy();

    const existingItemsResponse = await request.get(`${serverUrl}/api/item/shops/${shop._id}/items`);
    expect(
      existingItemsResponse.ok(),
      `Could not read existing items for ${shopName}: ${existingItemsResponse.status()} ${await existingItemsResponse.text()}`,
    ).toBeTruthy();

    const existingItemsPayload = await existingItemsResponse.json();
    const existingItems = /** @type {{ _id: string, name: string }[]} */ (
      existingItemsPayload.items || []
    );
    const existingItemsByName = new Map(
      existingItems.map((item) => [item.name.toLowerCase(), item]),
    );

    for (const [name, category, foodType, price] of selectedItems) {
      const existingItem = existingItemsByName.get(String(name).toLowerCase());

      if (existingItem) {
        if (updateExisting) {
          const updateResponse = await request.put(`${serverUrl}/api/item/items/${existingItem._id}`, {
            timeout: uploadTimeoutMs,
            multipart: {
              name,
              price: String(price),
              category,
              foodType,
              isAvailable: 'true',
            },
          });

          expect(
            updateResponse.ok(),
            `Update failed for ${shopName} / ${name}: ${updateResponse.status()} ${await updateResponse.text()}`,
          ).toBeTruthy();

          updated.push(`${shopName}: ${name}`);
          continue;
        }

        skipped.push(`${shopName}: ${name}`);
        continue;
      }

      const imageFile = imageFiles[imageIndex % imageFiles.length];
      imageIndex += 1;
      const imagePath = path.resolve(imagesDir, imageFile);

      expect(
        imagePath.startsWith(imagesDir),
        `Image path must stay inside ${imagesDir}: ${imageFile}`,
      ).toBeTruthy();
      expect(fs.existsSync(imagePath), `Missing item image: ${imagePath}`).toBeTruthy();

      const createResponse = await request.post(`${serverUrl}/api/item/shops/${shop._id}/items`, {
        timeout: uploadTimeoutMs,
        multipart: {
          name,
          price: String(price),
          category,
          foodType,
          isAvailable: 'true',
          image: {
            name: path.basename(imagePath),
            mimeType: imageMimeType(imagePath),
            buffer: fs.readFileSync(imagePath),
          },
        },
      });

      if (createResponse.status() === 400) {
        skipped.push(`${shopName}: ${name}`);
        continue;
      }

      expect(
        createResponse.ok(),
        `Create failed for ${shopName} / ${name}: ${createResponse.status()} ${await createResponse.text()}`,
      ).toBeTruthy();

      created.push(`${shopName}: ${name}`);
    }
  }

  console.log(
    `Bulk items complete. Created: ${created.length}. Updated: ${updated.length}. Skipped: ${skipped.length}.`,
  );
  if (created.length) console.log(`Created items: ${created.join(', ')}`);
  if (updated.length) console.log(`Updated items: ${updated.join(', ')}`);
  if (skipped.length) console.log(`Skipped items: ${skipped.join(', ')}`);
});
