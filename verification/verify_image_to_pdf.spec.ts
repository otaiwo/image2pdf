import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('Image to PDF converter unified design and sidebar job status', async ({ page }) => {
    // Navigate to Image to PDF tool
    await page.goto('http://localhost:8000/image-to-pdf');
    await page.waitForLoadState('networkidle');

    // 1. Initial state: Upload area visible, sidebar settings NOT visible
    await expect(page.locator('text=Select Images')).toBeVisible();
    // The sidebar should not contain image options yet
    await expect(page.locator('text=Image Options')).not.toBeVisible();

    // Create a dummy image for testing
    const testImagePath = path.join(__dirname, 'test-image.png');
    // Just a small transparent pixel or something
    fs.writeFileSync(testImagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

    // 2. Select file and check for sidebar settings
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Now sidebar settings should be visible (Progressive Disclosure)
    await expect(page.locator('text=Image Options')).toBeVisible();
    await expect(page.locator('text=Page Orientation')).toBeVisible();

    // 3. Start conversion
    const convertButton = page.locator('button:has-text("Convert to PDF")');
    await convertButton.click();

    // 4. Check for job status in the sidebar
    // While converting or after completion, the JobSidebar should show the active job
    // It should say "Processing..." or show download button
    await expect(page.locator('aside >> text=Converting...').or(page.locator('aside >> text=Completed'))).toBeVisible();

    // Sidebar settings (Image Options) should be GONE during/after conversion
    await expect(page.locator('aside >> text=Image Options')).not.toBeVisible();

    // Check for Download button in sidebar
    await expect(page.locator('aside >> text=Download PDF')).toBeVisible();
    await expect(page.locator('aside >> text=Convert Another')).toBeVisible();

    // 5. Test "Convert Another"
    await page.locator('button:has-text("Convert Another")').click();

    // Should be back to initial state
    await expect(page.locator('text=Select Images')).toBeVisible();
    await expect(page.locator('text=Image Options')).not.toBeVisible();

    // Clean up
    fs.unlinkSync(testImagePath);
});
