
from playwright.sync_api import sync_playwright

def verify_storybook(page):
    # Enable console logging
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Mock the API response
    def handle_route(route):
        print(f"Intercepted request: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body='''{
                "id": "mock-storybook-id",
                "title": "Grandpa's Factory Adventure",
                "pdfUrl": "http://example.com/mock.pdf",
                "pages": [
                    {
                        "pageNumber": 1,
                        "text": "Grandpa walked into the big factory.",
                        "imageUrl": "https://placehold.co/400x300/orange/white?text=Factory"
                    },
                    {
                        "pageNumber": 2,
                        "text": "He met his friend Bill.",
                        "imageUrl": "https://placehold.co/400x300/blue/white?text=Friend"
                    }
                ]
            }'''
        )

    page.route("**/api/storybooks/generate/**", handle_route)

    url = "http://localhost:3000/family/chapters/mock-chapter-id/storybook"
    print(f"Navigating to {url}")
    page.goto(url)

    # Check for specific states
    try:
        # Wait for either the storybook title OR the "Turn this Memory into Magic" text
        # to know the page has loaded at least.
        page.wait_for_selector("text=Grandpa's Factory Adventure", timeout=5000)
    except Exception as e:
        print("Target text not found. Checking for other states...")
        if page.is_visible("text=Turn this Memory into Magic"):
            print("Found 'Turn this Memory into Magic'. The auto-fetch might have failed or returned null.")
            # Try clicking the button
            print("Clicking Generate button...")
            page.click("button:has-text('Generate Storybook')")
            page.wait_for_selector("text=Grandpa's Factory Adventure", timeout=5000)
        else:
            print("Neither target text nor start button found.")
            page.screenshot(path="verification/debug_failure.png")
            print("Taken debug_failure.png")
            raise e

    # Take screenshot of cover page
    page.screenshot(path="verification/storybook_cover.png")
    print("Cover screenshot taken")

    # Click next
    page.locator("button").last.click()
    page.wait_for_timeout(500)
    page.screenshot(path="verification/storybook_page1.png")
    print("Page 1 screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_storybook(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
