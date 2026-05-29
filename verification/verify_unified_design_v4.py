from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

    # Navigate to Image to PDF tool
    print("Navigating to http://localhost:8000/image-to-pdf")
    page.goto("http://localhost:8000/image-to-pdf")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    # Initial screenshot
    page.screenshot(path="/home/jules/verification/screenshots/v4_1_initial.png")

    # Select file.
    print("Setting input files...")
    file_input = page.locator("input[type='file']").first
    file_input.set_input_files("/home/jules/verification/test-image.png")

    # Wait for the file list or the sidebar to appear
    print("Waiting for file to appear in UI...")
    try:
        # Check if the filename appears on the page
        page.wait_for_selector("text=test-image.png", timeout=10000)
        print("File appeared in UI")
    except Exception as e:
        print(f"File did NOT appear in UI: {e}")
        page.screenshot(path="/home/jules/verification/screenshots/v4_error_upload.png")
        # Let's try the other input if there are two
        if page.locator("input[type='file']").count() > 1:
            print("Trying second file input...")
            page.locator("input[type='file']").nth(1).set_input_files("/home/jules/verification/test-image.png")
            try:
                page.wait_for_selector("text=test-image.png", timeout=10000)
                print("File appeared in UI after second attempt")
            except:
                print("File still NOT in UI")

    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/v4_2_after_upload.png")

    # Check for sidebar settings
    settings_sidebar = page.locator("aside.sticky")
    if settings_sidebar.count() > 0:
        sidebar_text = settings_sidebar.inner_text()
        print(f"Settings Sidebar text: {sidebar_text}")
        if "Image Options" in sidebar_text:
            print("Success: Progressive disclosure working - Image Options visible")
    else:
        print("Sidebar aside.sticky not found")

    # Start conversion
    print("Looking for Convert button...")
    convert_button = page.get_by_role("button", name="Convert to PDF")
    if not convert_button.is_visible():
        convert_button = page.locator("button:has-text('Convert to PDF')").first

    if convert_button.is_visible():
        convert_button.click()
        print("Clicked Convert button")
    else:
        print("Convert button NOT visible")

    page.wait_for_timeout(3000)

    # Check for job status in the sidebar
    page.screenshot(path="/home/jules/verification/screenshots/v4_3_converting.png")

    # Wait for completion
    print("Waiting for completion...")
    page.wait_for_timeout(15000)
    page.screenshot(path="/home/jules/verification/screenshots/v4_4_completed.png")

    if settings_sidebar.count() > 0:
        sidebar_after = settings_sidebar.inner_text()
        print(f"Sidebar after conversion: {sidebar_after}")
        if "Download" in sidebar_after or "Completed" in sidebar_after:
            print("Success: Job status visible in sidebar")
        if "Image Options" not in sidebar_after:
            print("Success: Image Options hidden during/after conversion")

    # Test "Convert Another"
    convert_another = page.get_by_role("button", name="Convert Another")
    if not convert_another.is_visible():
        convert_another = page.locator("button:has-text('Convert Another')").first

    if convert_another.is_visible():
        convert_another.click()
        print("Clicked Convert Another")
        page.wait_for_timeout(2000)
        page.screenshot(path="/home/jules/verification/screenshots/v4_5_after_reset.png")

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
