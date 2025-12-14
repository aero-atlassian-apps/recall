from playwright.sync_api import sync_playwright

def verify_transcript_accessibility():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to test page
        url = "http://localhost:3000/test-transcript"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Check if transcript list exists with correct aria label
        transcript_list = page.locator("ol[aria-label='Conversation transcript']")

        if transcript_list.count() > 0:
            print("✅ Found ordered list with correct aria-label")
        else:
            print("❌ Could not find ordered list with correct aria-label")
            print(page.content())

        # Check for list items (should be 3 messages + 1 spacer)
        items = transcript_list.locator("li")
        count = items.count()
        print(f"Found {count} list items (expected 4)")

        # Check for avatars with role img
        avatars = page.locator("div[role='img']")
        avatar_count = avatars.count()
        print(f"Found {avatar_count} avatars with role='img' (expected 3)")

        # Verify aria-labels on avatars
        agent_avatars = page.locator("div[aria-label='Agent avatar']")
        user_avatars = page.locator("div[aria-label='User avatar']")
        print(f"Found {agent_avatars.count()} agent avatars (expected 2)")
        print(f"Found {user_avatars.count()} user avatars (expected 1)")

        # Take screenshot
        page.screenshot(path="verification/transcript_verification_final.png")

        browser.close()

if __name__ == "__main__":
    verify_transcript_accessibility()
