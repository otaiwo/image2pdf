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

        # Use more robust upload method
        async with page.expect_file_chooser() as fc_info:
            await page.click('text=Select Images')
        file_chooser = await fc_info.value
        await file_chooser.set_files("test-image.png")

        # Wait for state update
        await page.wait_for_selector('text=1 image selected', timeout=5000)

        # Take screenshot after upload
        await page.screenshot(path="verification/image_to_pdf_after_upload_v3.png")

        sidebar_options = page.locator('text=PDF Options')
        if await sidebar_options.is_visible():
            print("✓ Sidebar options visible after upload")

            # Now trigger conversion
            await page.click('button:has-text("Convert to PDF")')

            # Wait for conversion to start (sidebar should change)
            await page.wait_for_selector('text=CONVERTING...', timeout=5000)
            print("✓ Sidebar transitioned to active job status")
            await page.screenshot(path="verification/image_to_pdf_converting_v3.png")

        else:
            print("✗ Sidebar options NOT visible after upload")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
