from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # Navigate to Image to PDF tool
    page.goto("http://localhost:8000/image-to-pdf")
    page.wait_for_timeout(3000)

    # Initial screenshot
    page.screenshot(path="/home/jules/verification/screenshots/v3_1_initial.png")

    # Select file.
    file_inputs = page.locator("input[type='file']")
    count = file_inputs.count()
    print(f"Found {count} file inputs")

    # The dropzone usually has the file input.
    # Let's try the first one that works.
    file_inputs.first.set_input_files("/home/jules/verification/test-image.png")

    page.wait_for_timeout(3000)

    # Check if files are loaded.
    page.screenshot(path="/home/jules/verification/screenshots/v3_2_after_upload.png")

    # Check if "Image Options" appeared in the RIGHT sidebar
    # The right sidebar has class "sticky top-8" or is role "complementary"
    settings_sidebar = page.locator("aside.sticky")
    sidebar_text = settings_sidebar.inner_text()
    print(f"Settings Sidebar text: {sidebar_text}")

    if "Image Options" in sidebar_text:
        print("Success: Progressive disclosure working - Image Options visible")
    else:
        # Maybe it's not visible yet? Let's check the whole page just in case
        if "Image Options" in page.content():
             print("Image Options found in page but maybe not in sidebar or sidebar locator failed")
        else:
             print("Failure: Image Options NOT found on page")

    # Start conversion
    convert_button = page.get_by_role("button", name="Convert to PDF")
    if not convert_button.is_visible():
        convert_button = page.locator("button:has-text('Convert to PDF')").first

    convert_button.click()
    print("Clicked Convert button")

    page.wait_for_timeout(3000)

    # Check for job status in the sidebar
    page.screenshot(path="/home/jules/verification/screenshots/v3_3_converting.png")

    # Wait for completion (poll for download button in sidebar)
    # We give it some time to process
    page.wait_for_timeout(10000)
    page.screenshot(path="/home/jules/verification/screenshots/v3_4_completed.png")

    sidebar_after = settings_sidebar.inner_text()
    print(f"Sidebar after conversion: {sidebar_after}")

    if "Completed" in sidebar_after or "Download" in sidebar_after:
        print("Success: Job status visible in sidebar")
    else:
        print("Failure: Job status NOT visible in sidebar")

    if "Image Options" not in sidebar_after:
        print("Success: Image Options hidden during/after conversion")
    else:
        print("Failure: Image Options STILL visible in sidebar")

    # Test "Convert Another"
    convert_another = page.get_by_role("button", name="Convert Another")
    if not convert_another.is_visible():
        convert_another = page.locator("button:has-text('Convert Another')").first

    convert_another.click()
    print("Clicked Convert Another")

    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/v3_5_after_reset.png")

    final_sidebar = settings_sidebar.inner_text()
    if "Image Options" not in final_sidebar:
        print("Success: Back to initial state (sidebar empty/hidden)")

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
