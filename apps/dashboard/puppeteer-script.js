/**
 * @param {import('puppeteer').Browser} browser
 * @param {any} context
 */
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  
  // Navigate to the login page
  await page.goto('http://localhost:3004/login');
  
  // Fill in the credentials
  await page.type('#email', process.env.ADMIN_EMAIL || 'admin@ournigeria.ng');
  await page.type('#password', process.env.ADMIN_PASSWORD || 'password');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for the Next.js client-side navigation to /dashboard
  await page.waitForFunction(() => window.location.pathname === '/dashboard');
  
  // Close the page session for the next run
  await page.close();
};