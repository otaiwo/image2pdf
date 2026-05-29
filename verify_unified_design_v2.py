import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Verifying Image to PDF...")
        await page.goto("http://127.0.0.1:8000/image-to-pdf")

        # Take initial screenshot
        await page.screenshot(path="verification/image_to_pdf_initial.png")

        # Upload a file
        with open("test-image.png", "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

        # Try a more specific selector for the input
        await page.set_input_files('input[type="file"]', "test-image.png")

        # Wait a bit for state update
        await page.wait_for_timeout(2000)

        # Take screenshot after upload
        await page.screenshot(path="verification/image_to_pdf_after_upload.png")

        sidebar_options = page.locator('text=PDF Options')
        if await sidebar_options.is_visible():
            print("✓ Sidebar options visible after upload")
        else:
            print("✗ Sidebar options NOT visible after upload")
            # Log current page content for debugging
            content = await page.content()
            with open("verification/page_debug.html", "w") as f:
                f.write(content)

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
