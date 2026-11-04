import subprocess
import os
import shutil
import sys

# Force UTF-8 output encoding for Windows consoles
sys.stdout.reconfigure(encoding='utf-8')

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
base_dir = r"C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app"
screenshots_dir = os.path.join(base_dir, "docs", "screenshots")
dist_html = os.path.join(base_dir, "dist", "index.html").replace("\\", "/")

os.makedirs(screenshots_dir, exist_ok=True)

# Cleanup test files if present
for tmp in ["test_app.pdf", "test_app.png", "test_direct_screenshot.png", "test_driver_screenshot.png", "test_out.pdf"]:
    p = os.path.join(screenshots_dir, tmp)
    if os.path.exists(p):
        try: os.remove(p)
        except: pass

temp_prof = os.path.join(screenshots_dir, "temp_profile")
if os.path.exists(temp_prof):
    try: shutil.rmtree(temp_prof)
    except: pass

targets = [
    {
        "filename": "01_desktop_customer_home.png",
        "title": "Desktop Customer Home (Full Width)",
        "url": f"file:///{dist_html}",
        "width": 1440,
        "height": 900
    },
    {
        "filename": "02_desktop_chauffeur_portal.png",
        "title": "Desktop Chauffeur Cockpit",
        "url": f"file:///{dist_html}?role=driver&screen=driver_dash",
        "width": 1440,
        "height": 900
    },
    {
        "filename": "03_desktop_operations_dashboard.png",
        "title": "Desktop Operations Control Center",
        "url": f"file:///{dist_html}?role=admin&screen=admin_dash",
        "width": 1440,
        "height": 900
    },
    {
        "filename": "04_mobile_customer_home.png",
        "title": "Mobile Customer Home Screen",
        "url": f"file:///{dist_html}",
        "width": 390,
        "height": 844
    },
    {
        "filename": "05_mobile_booking_flow.png",
        "title": "Mobile Booking & Fare Review",
        "url": f"file:///{dist_html}?screen=booking",
        "width": 390,
        "height": 844
    },
    {
        "filename": "06_mobile_chauffeur_portal.png",
        "title": "Mobile Chauffeur Portal",
        "url": f"file:///{dist_html}?role=driver&screen=driver_dash",
        "width": 390,
        "height": 844
    }
]

print("=======================================================")
print("[CAPTURE] CAPTURING ALL 6 REAL VERIFICATION SCREENSHOTS")
print("=======================================================")

results = []

for t in targets:
    out_path = os.path.join(screenshots_dir, t["filename"])
    if os.path.exists(out_path):
        os.remove(out_path)
    
    print(f"Capturing: {t['title']} ({t['width']}x{t['height']})...")
    
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--allow-file-access-from-files",
        "--hide-scrollbars",
        "--virtual-time-budget=3500",
        f"--window-size={t['width']},{t['height']}",
        f"--screenshot={out_path}",
        t["url"]
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        size_kb = round(os.path.getsize(out_path) / 1024, 1)
        print(f"  [PASS] Saved: {t['filename']} ({size_kb} KB)")
        results.append((t["filename"], t["title"], size_kb, True))
    else:
        print(f"  [FAIL] Failed: {t['filename']}")
        results.append((t["filename"], t["title"], 0, False))

print("=======================================================")
print(f"[COMPLETE] {sum(1 for r in results if r[3])}/{len(targets)} Saved to docs/screenshots/")
print("=======================================================")
