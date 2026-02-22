/**
 * Screenshot Capture Script for Handloom Weavers Nexus
 * Automatically captures screenshots of all pages and saves them with descriptive names
 * 
 * Usage: node scripts/capture-screenshots.js
 * Prerequisites: Server must be running on http://localhost:3000
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const SCREENSHOTS_FULL_DIR = path.join(SCREENSHOTS_DIR, 'full');
const SCREENSHOTS_VIEWPORT_DIR = path.join(SCREENSHOTS_DIR, 'viewport');

// Ensure screenshot directories exist
[SCREENSHOTS_DIR, SCREENSHOTS_FULL_DIR, SCREENSHOTS_VIEWPORT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Page configurations: { url, name, description, needsAuth, role, waitFor }
const pages = [
    // Public pages
    { url: '/pages/buyer-home.html', name: '01_Buyer_Home', description: 'Buyer Home Page - Product Catalog' },
    { url: '/pages/login.html', name: '02_Login', description: 'Login Page' },
    { url: '/pages/register.html', name: '03_Register', description: 'Registration Page' },
    { url: '/pages/join-weaver.html', name: '04_Join_Weaver', description: 'Weaver Registration Page' },
    { url: '/pages/saree-detail.html?id=1', name: '05_Saree_Detail', description: 'Saree Product Detail Page' },
    { url: '/pages/story.html', name: '06_Story_Gallery', description: 'Weaver Stories Gallery' },
    { url: '/pages/story-detail.html?id=1', name: '07_Story_Detail', description: 'Story Detail Page' },
    { url: '/pages/faq.html', name: '08_FAQ', description: 'Frequently Asked Questions' },
    { url: '/pages/contact.html', name: '09_Contact', description: 'Contact Page' },
    
    // Buyer pages (requires buyer login)
    { url: '/pages/profile.html', name: '11_Buyer_Profile', description: 'Buyer Profile Page', needsAuth: true, role: 'buyer' },
    { url: '/pages/cart.html', name: '12_Buyer_Cart', description: 'Shopping Cart', needsAuth: true, role: 'buyer' },
    { url: '/pages/checkout.html', name: '13_Buyer_Checkout', description: 'Checkout Page', needsAuth: true, role: 'buyer' },
    { url: '/pages/wishlist.html', name: '14_Buyer_Wishlist', description: 'Wishlist Page', needsAuth: true, role: 'buyer' },
    { url: '/pages/order-history.html', name: '15_Buyer_Order_History', description: 'Order History', needsAuth: true, role: 'buyer' },
    
    // Weaver pages (requires weaver login)
    { url: '/pages/weaver-dashboard.html', name: '16_Weaver_Dashboard', description: 'Weaver Dashboard', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-sarees.html', name: '17_Weaver_Sarees', description: 'Weaver Sarees Management', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-upload.html', name: '18_Weaver_Upload', description: 'Saree Upload Form', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-manage-stories.html', name: '19_Weaver_Stories', description: 'Story Management', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-story.html', name: '20_Weaver_Story_Upload', description: 'Story Upload Form', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-orders.html', name: '21_Weaver_Orders', description: 'Weaver Orders Report', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-sales-report.html', name: '22_Weaver_Sales_Report', description: 'Sales Report', needsAuth: true, role: 'weaver' },
    { url: '/pages/weaver-pending.html', name: '23_Weaver_Pending', description: 'Pending Approval Status', needsAuth: true, role: 'weaver' },
    
    // Admin pages (requires admin login)
    { url: '/pages/admin-dashboard.html', name: '24_Admin_Dashboard', description: 'Admin Dashboard', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-approvals.html', name: '25_Admin_Approvals', description: 'Admin Approvals Page', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-users.html', name: '26_Admin_Users', description: 'User Management', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-sarees.html', name: '27_Admin_Sarees', description: 'Saree Management', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-orders.html', name: '28_Admin_Orders', description: 'Order Management', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-categories.html', name: '29_Admin_Categories', description: 'Category Management', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-offers.html', name: '30_Admin_Offers', description: 'Offer Management', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-analytics.html', name: '31_Admin_Analytics', description: 'Platform Analytics', needsAuth: true, role: 'admin' },
    { url: '/pages/admin-report.html', name: '32_Admin_Report', description: 'System Report', needsAuth: true, role: 'admin' },
];

// Test credentials (update these if needed)
const credentials = {
    buyer: { email: 'buyer1@demo.com', password: 'Demo@123' },
    weaver: { email: 'weaver1@demo.com', password: 'Demo@123' },
    admin: { email: 'admin@nexus.com', password: 'Admin@123' }
};

async function login(page, role) {
    const creds = credentials[role];
    if (!creds) return false;
    
    try {
        // Navigate to login page with fresh context
        await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'networkidle0' });
        
        // Wait a moment for any redirects to complete
        await page.waitForTimeout(1000);
        
        // Check if we're still on login page (might have been redirected if already logged in)
        const currentUrl = page.url();
        if (!currentUrl.includes('/login.html')) {
            // Already logged in or redirected - clear cookies and try again
            await page.deleteCookie(...await page.cookies());
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            await page.goto(`${BASE_URL}/pages/login.html`, { waitUntil: 'networkidle0' });
        }
        
        // Wait for email input (using ID selector which is more reliable)
        await page.waitForSelector('#email', { timeout: 10000 });
        
        // Clear and fill in credentials
        await page.evaluate(() => {
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        });
        
        await page.type('#email', creds.email, { delay: 50 });
        await page.type('#password', creds.password, { delay: 50 });
        
        // Submit form
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
            page.click('button[type="submit"]')
        ]);
        
        // Verify login by checking if we're redirected away from login page
        const finalUrl = page.url();
        if (finalUrl.includes('/login.html')) {
            console.error(`Login failed - still on login page after submit`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Login failed for ${role}:`, error.message);
        return false;
    }
}

async function captureScreenshot(page, config) {
    try {
        const fullUrl = `${BASE_URL}${config.url}`;
        console.log(`Capturing: ${config.name} - ${config.description}`);
        
        await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);
        
        // 1. Full-page screenshot → screenshots/full/
        const fullPath = path.join(SCREENSHOTS_FULL_DIR, `${config.name}.png`);
        await page.screenshot({
            path: fullPath,
            fullPage: true,
            type: 'png'
        });
        
        // 2. Viewport (screen-height) screenshot → screenshots/viewport/
        const viewportPath = path.join(SCREENSHOTS_VIEWPORT_DIR, `${config.name}.png`);
        await page.screenshot({
            path: viewportPath,
            fullPage: false,
            type: 'png'
        });
        
        console.log(`✓ Saved: full/${config.name}.png, viewport/${config.name}.png`);
        return true;
    } catch (error) {
        console.error(`✗ Failed: ${config.name} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Screenshot Capture...\n');
    console.log(`📁 Screenshots will be saved to:`);
    console.log(`   • Full page: ${SCREENSHOTS_FULL_DIR}`);
    console.log(`   • Viewport (screen height): ${SCREENSHOTS_VIEWPORT_DIR}\n`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Check if server is running by trying to navigate
    console.log('🔍 Checking if server is running...');
    const testPage = await browser.newPage();
    try {
        await testPage.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 5000 });
        console.log('✓ Server is running\n');
    } catch (error) {
        await testPage.close();
        await browser.close();
        console.error('❌ ERROR: Server is not running on http://localhost:3000');
        console.error('   Please start the server first: npm start\n');
        process.exit(1);
    }
    await testPage.close();
    
    let currentRole = null;
    let currentPage = null;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < pages.length; i++) {
        const pageConfig = pages[i];
        const nextPageConfig = pages[i + 1];
        
        // Determine if we need a new page
        const needsNewPage = 
            !pageConfig.needsAuth || // Public page
            (pageConfig.needsAuth && pageConfig.role !== currentRole) || // Different role
            !currentPage; // No current page
        
        if (needsNewPage) {
            // Close previous page
            if (currentPage) {
                await currentPage.close();
                currentPage = null;
                currentRole = null;
            }
            
            // Create new page
            currentPage = await browser.newPage();
            await currentPage.setViewport({ width: 1920, height: 1080 });
            
            // Login if needed
            if (pageConfig.needsAuth) {
                console.log(`\n🔐 Logging in as ${pageConfig.role}...`);
                const loggedIn = await login(currentPage, pageConfig.role);
                if (loggedIn) {
                    currentRole = pageConfig.role;
                    console.log(`✓ Logged in as ${pageConfig.role}\n`);
                } else {
                    console.log(`✗ Failed to login as ${pageConfig.role}, skipping remaining ${pageConfig.role} pages...\n`);
                    await currentPage.close();
                    currentPage = null;
                    currentRole = null;
                    failCount++;
                    // Skip all pages of this role
                    while (i + 1 < pages.length && pages[i + 1].needsAuth && pages[i + 1].role === pageConfig.role) {
                        i++;
                        failCount++;
                    }
                    continue;
                }
            }
        }
        
        const page = currentPage;
        
        // Capture screenshot
        const success = await captureScreenshot(page, pageConfig);
        if (success) successCount++;
        else failCount++;
        
        // Close page if next page is different role or public
        if (currentPage && (
            !nextPageConfig || // Last page
            (!nextPageConfig.needsAuth) || // Next is public
            (nextPageConfig.needsAuth && nextPageConfig.role !== currentRole) // Next is different role
        )) {
            await currentPage.close();
            currentPage = null;
            currentRole = null;
        }
        
        // Small delay between captures
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Close any remaining page
    if (currentPage) {
        await currentPage.close();
    }
    
    await browser.close();
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Screenshot capture complete!`);
    console.log(`   ✓ Success: ${successCount}`);
    console.log(`   ✗ Failed: ${failCount}`);
    console.log(`   📁 Full: ${SCREENSHOTS_FULL_DIR}`);
    console.log(`   📁 Viewport: ${SCREENSHOTS_VIEWPORT_DIR}`);
    console.log('='.repeat(50) + '\n');
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
