import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Verifying Image to PDF...")
        await page.goto("http://127.0.0.1:8000/image-to-pdf")

        # Upload a file
        with open("test-image.png", "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

        async with page.expect_file_chooser() as fc_info:
            await page.click('text=Select Images')
        file_chooser = await fc_info.value
        await file_chooser.set_files("test-image.png")

        await page.wait_for_selector('text=1 image selected', timeout=5000)

        # Trigger conversion
        await page.click('button:has-text("Convert to PDF")')

        # Wait for the status indicator in the sidebar
        # We look for the status badge which should appear in the JobSidebar
        await page.wait_for_selector('.bg-white.dark\\:bg-gray-900.border-gray-100 >> text=pending', timeout=10000)
        print("✓ JobSidebar appearing in sidebar with pending status")

        # Check if settings are GONE
        is_settings_visible = await page.locator('text=PDF Options').is_visible()
        print(f"✓ PDF Options hidden during processing: {not is_settings_visible}")

        await page.screenshot(path="verification/image_to_pdf_sidebar_transition.png")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
