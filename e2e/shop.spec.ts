import { expect, type Page, test } from "@playwright/test";

const admin = { email: "admin@shop.local", password: "Admin@12345" };
const cashier = { email: "cashier@shop.local", password: "Cashier@12345" };

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

function stockCount(label: string | null) {
  const match = label?.match(/(\d+) in stock/);
  if (!match) throw new Error(`Stock count missing from "${label}"`);
  return Number(match[1]);
}

test("shop flows work on the configured database", async ({ page, browser }) => {
  test.setTimeout(240_000);

  await login(page, admin);
  await expect(page.getByRole("heading", { name: /Good day/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Shift open/ })).toBeVisible();

  const upload = await page.request.post("/api/uploads/image", {
    multipart: { note: "missing-file" },
  });
  expect(upload.status()).toBe(400);
  const uploadJson = await upload.json();
  expect(uploadJson.error.code).toBe("VALIDATION");

  await page.goto("/checkout");
  await page.getByPlaceholder("Search name or SKU…").fill("BAT-CR2032");
  const product = page.getByRole("button", { name: /CR2032 Watch Battery/ });
  await expect(product).toBeVisible();
  const before = stockCount(await product.textContent());
  const saleResponse = page.waitForResponse(
    (response) => response.url().includes("/api/sales") && response.request().method() === "POST",
  );
  await product.click();
  await page.getByRole("button", { name: "Complete sale" }).click();
  const sale = await saleResponse;
  expect(sale.ok(), await sale.text()).toBeTruthy();
  const saleJson = await sale.json();
  expect(saleJson.data.invoiceNumber).toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/sales/${saleJson.data._id}`));
  await expect(page.getByText(`Invoice: ${saleJson.data.invoiceNumber}`)).toBeVisible();

  await page.goto("/checkout");
  await page.getByPlaceholder("Search name or SKU…").fill("BAT-CR2032");
  await expect(product).toContainText(`${before - 1} in stock`);

  await page.goto(`/sales/${saleJson.data._id}`);
  const voidResponse = page.waitForResponse(
    (response) => response.url().includes("/void") && response.request().method() === "POST",
  );
  await page.getByPlaceholder("Reason").fill("E2E void");
  await page.getByRole("button", { name: "Void sale" }).click();
  const voided = await voidResponse;
  expect(voided.ok(), await voided.text()).toBeTruthy();
  await expect(page.getByText("voided", { exact: false }).first()).toBeVisible();

  await page.goto("/checkout");
  await page.getByPlaceholder("Search name or SKU…").fill("BAT-CR2032");
  await expect(product).toContainText(`${before} in stock`);

  const repairResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/repairs") && response.request().method() === "POST",
  );
  await page.goto("/repairs/new");
  await page.getByPlaceholder("e.g. Nimal Perera").fill("E2E Customer");
  await page.getByPlaceholder("07X XXX XXXX").fill("0771234567");
  await page.getByPlaceholder("e.g. Seiko").fill("Seiko");
  await page.getByPlaceholder("e.g. Presage").fill("Presage");
  await page.getByPlaceholder(/What the customer reported/).fill("Stopped overnight");
  await page.getByPlaceholder("2500").fill("2500");
  await page.getByRole("button", { name: "Create ticket" }).click();
  const repair = await repairResponse;
  expect(repair.ok(), await repair.text()).toBeTruthy();
  const repairJson = await repair.json();
  await expect(page).toHaveURL(new RegExp(`/repairs/${repairJson.data._id}/token`));
  await expect(page.getByText(repairJson.data.ticketId, { exact: true })).toBeVisible();

  const advanceResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/repairs/${repairJson.data._id}`) &&
      response.request().method() === "PATCH",
  );
  await page.goto(`/repairs/${repairJson.data._id}`);
  await page.getByRole("button", { name: /Advance to/ }).click();
  const advanced = await advanceResponse;
  expect(advanced.ok(), await advanced.text()).toBeTruthy();
  await expect(page.getByText("In progress")).toBeVisible();

  const stockResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/stock-adjustments") && response.request().method() === "POST",
  );
  await page.goto("/inventory/adjustments");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /CR2016 Watch Battery/ }).click();
  await page.getByRole("button", { name: "+10" }).click();
  await page.getByRole("button", { name: "Apply adjustment" }).click();
  const stock = await stockResponse;
  expect(stock.ok(), await stock.text()).toBeTruthy();
  await expect(page.getByText("Stock updated")).toBeVisible();

  const sku = `E2E-${Date.now().toString().slice(-6)}`;
  const productResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/products") && response.request().method() === "POST",
  );
  await page.goto("/inventory/products/new");
  await page.getByPlaceholder("e.g. Classic Men's Dress Watch").fill("E2E Dress Watch");
  await page.getByPlaceholder("WCH-M-CLASSIC").fill(sku);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Men's Watches", exact: true }).click();
  await page.getByPlaceholder("12500.00").fill("15000");
  await page.getByPlaceholder("0", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Create product" }).click();
  const createdProduct = await productResponse;
  expect(createdProduct.ok(), await createdProduct.text()).toBeTruthy();
  await page.goto("/inventory/products");
  await page.getByPlaceholder("Search name or SKU…").fill(sku);
  await expect(page.getByText("E2E Dress Watch")).toBeVisible();

  const categoryResponse = page.waitForResponse(
    (response) => response.url().includes("/api/categories") && response.request().method() === "POST",
  );
  await page.goto("/inventory/categories");
  await page.locator("form").getByText("Name", { exact: true }).locator("xpath=following::input[1]").fill("E2E Straps");
  await page.getByRole("button", { name: "Add category" }).click();
  const category = await categoryResponse;
  expect(category.ok(), await category.text()).toBeTruthy();
  await expect(page.getByRole("button", { name: /E2E Straps/ })).toBeVisible();

  await page.goto("/reports/daily");
  await expect(page.getByRole("heading", { name: "Daily sales" })).toBeVisible();
  const csv = await page.request.get("/api/reports/daily/export.csv");
  expect(csv.ok()).toBeTruthy();
  expect(await csv.text()).toContain("Retail revenue");

  const settingsResponse = page.waitForResponse(
    (response) => response.url().includes("/api/settings") && response.request().method() === "PATCH",
  );
  await page.goto("/settings");
  const shopName = page.getByText("Shop name", { exact: true }).locator("xpath=following::input[1]");
  await expect(shopName).toHaveValue("Premier Watch House");
  await shopName.fill("E2E Shop");
  await page.getByRole("button", { name: "Save settings" }).click();
  expect((await settingsResponse).ok()).toBeTruthy();
  await expect(page.getByText("Settings saved")).toBeVisible();
  const restoreResponse = page.waitForResponse(
    (response) => response.url().includes("/api/settings") && response.request().method() === "PATCH",
  );
  await shopName.fill("Premier Watch House");
  await page.getByRole("button", { name: "Save settings" }).click();
  expect((await restoreResponse).ok()).toBeTruthy();

  const staffEmail = `e2e.cashier.${Date.now()}@shop.local`;
  const userResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/users") && response.request().method() === "POST",
  );
  await page.goto("/users");
  await page.getByPlaceholder("e.g. Front Counter").fill("E2E Cashier");
  await page.getByPlaceholder("cashier@shop.local").fill(staffEmail);
  await page.getByPlaceholder("••••••••").fill("Cashier@12345");
  await page.getByRole("button", { name: "Create user" }).click();
  expect((await userResponse).ok()).toBeTruthy();
  const row = page.locator("li", { hasText: staffEmail });
  await row.getByRole("button", { name: "Edit" }).click();
  const patchResponse = page.waitForResponse(
    (response) => response.url().includes("/api/users/") && response.request().method() === "PATCH",
  );
  await page.getByRole("checkbox", { name: "Active login" }).uncheck();
  await page.getByRole("button", { name: "Save" }).click();
  expect((await patchResponse).ok()).toBeTruthy();

  const cashierContext = await browser.newContext();
  const cashierPage = await cashierContext.newPage();
  await login(cashierPage, cashier);
  await cashierPage.goto("/users");
  await expect(cashierPage).toHaveURL(/\/dashboard/);
  await cashierPage.goto("/settings");
  await expect(cashierPage).toHaveURL(/\/dashboard/);
  await logout(cashierPage);

  await cashierPage.goto("/login");
  await cashierPage.locator("#email").fill(staffEmail);
  await cashierPage.locator("#password").fill("Cashier@12345");
  await cashierPage.getByRole("button", { name: "Sign in" }).click();
  await expect(cashierPage.getByText("This account is inactive")).toBeVisible();
  await cashierContext.close();
});
