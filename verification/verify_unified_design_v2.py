from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # Navigate to Image to PDF tool
    page.goto("http://localhost:8000/image-to-pdf")
    page.wait_for_timeout(3000)

    # Initial screenshot
    page.screenshot(path="/home/jules/verification/screenshots/v2_1_initial.png")

    # Select file. There are 2 inputs, let's try to be specific or try both.
    # Usually the dropzone input is the one we want.
    file_inputs = page.locator("input[type='file']")
    count = file_inputs.count()
    print(f"Found {count} file inputs")

    # Try setting files on all of them just in case, or pick the one that's visible/enabled
    for i in range(count):
        try:
            file_inputs.nth(i).set_input_files("/home/jules/verification/test-image.png")
        except:
            pass

    page.wait_for_timeout(3000)

    # Check if files are loaded. We can check for the filename or "1 file selected" if we had that.
    # Our UI shows the file list.
    page.screenshot(path="/home/jules/verification/screenshots/v2_2_after_upload.png")

    # Check if "Image Options" appeared in sidebar
    sidebar_text = page.locator("aside").inner_text()
    print(f"Sidebar text: {sidebar_text}")

    if "Image Options" in sidebar_text:
        print("Success: Progressive disclosure working - Image Options visible")
    else:
        print("Failure: Image Options NOT visible in sidebar")

    # Start conversion
    convert_button = page.get_by_role("button", name="Convert to PDF")
    if convert_button.is_visible():
        convert_button.click()
        print("Clicked Convert button")
    else:
        # Try finding by text if role fails
        page.locator("button:has-text('Convert to PDF')").first.click()
        print("Clicked Convert button (fallback)")

    page.wait_for_timeout(3000)

    # Check for job status in the sidebar
    page.screenshot(path="/home/jules/verification/screenshots/v2_3_converting.png")

    # Wait for completion
    page.wait_for_timeout(10000)
    page.screenshot(path="/home/jules/verification/screenshots/v2_4_completed.png")

    sidebar_after = page.locator("aside").inner_text()
    if "Completed" in sidebar_after or "Download" in sidebar_after:
        print("Success: Job status visible in sidebar")
    if "Image Options" not in sidebar_after:
        print("Success: Image Options hidden during/after conversion")

    # Test "Convert Another"
    page.get_by_role("button", name="Convert Another").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/v2_5_after_reset.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
