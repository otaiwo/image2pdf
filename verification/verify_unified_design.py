from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # Navigate to Image to PDF tool
    page.goto("http://localhost:8000/image-to-pdf")
    page.wait_for_timeout(2000)

    # 1. Initial state: Upload area visible, sidebar settings NOT visible
    # Check for "Select Images" or the dropzone text
    page.screenshot(path="/home/jules/verification/screenshots/1_initial_state.png")

    # 2. Select file
    # We need to find the file input. It's usually hidden but we can use set_input_files on the input[type=file]
    # In our React component, we use react-dropzone which has an input[type=file]
    page.set_input_files("input[type='file']", "/home/jules/verification/test-image.png")
    page.wait_for_timeout(2000)

    # 3. Check for sidebar settings (Progressive Disclosure)
    page.screenshot(path="/home/jules/verification/screenshots/2_after_upload.png")

    # 4. Start conversion
    # Find the button "Convert to PDF"
    convert_button = page.get_by_role("button", name="Convert to PDF")
    if convert_button.is_visible():
        convert_button.click()
    else:
        # Fallback if name is different
        page.get_by_role("button").filter(has_text="Convert").first.click()

    page.wait_for_timeout(2000)

    # 5. Check for job status in the sidebar
    page.screenshot(path="/home/jules/verification/screenshots/3_converting.png")

    # Wait for completion (poll for download button in sidebar)
    # We give it some time to process
    page.wait_for_timeout(10000)
    page.screenshot(path="/home/jules/verification/screenshots/4_completed.png")

    # 6. Test "Convert Another"
    convert_another = page.get_by_role("button", name="Convert Another")
    if convert_another.is_visible():
        convert_another.click()
    else:
        # Maybe it's in the sidebar
        page.locator("aside").get_by_role("button", name="Convert Another").click()

    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/5_after_reset.png")

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
