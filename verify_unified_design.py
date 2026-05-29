import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Start the Laravel server in the background if not already running
        # Assuming it's already running as per the environment

        print("Verifying Image to PDF...")
        await page.goto("http://127.0.0.1:8000/image-to-pdf")

        # 1. Check initial state: Dropzone should be visible, Sidebar settings should NOT be visible
        uploader = page.locator('text=Select Images')
        await uploader.wait_for(state="visible")
        print("✓ Uploader visible")

        sidebar_options = page.locator('text=PDF Options')
        is_sidebar_hidden = not await sidebar_options.is_visible()
        print(f"✓ Sidebar options hidden initially: {is_sidebar_hidden}")

        # 2. Upload a file
        # Create a dummy image file
        with open("test-image.png", "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

        await page.set_input_files('input[type="file"]', "test-image.png")

        # 3. Check active state: Sidebar settings should BE visible
        await sidebar_options.wait_for(state="visible")
        print("✓ Sidebar options visible after upload")

        # Take a screenshot for visual confirmation
        await page.screenshot(path="verification/image_to_pdf_active.png")

        # 4. Trigger conversion and check sidebar transition
        convert_btn = page.locator('button:has-text("Convert to PDF")')
        await convert_btn.click()

        # Sidebar should transition to JobSidebar (Active Job)
        converting_text = page.locator('text=Converting...')
        await converting_text.wait_for(state="visible")
        print("✓ Sidebar transitioned to active job status")

        # Take a screenshot during processing
        await page.screenshot(path="verification/image_to_pdf_processing.png")

        # Cleanup
        os.remove("test-image.png")
        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify())
