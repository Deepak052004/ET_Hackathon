import requests
import time
import json
import sys

BASE_URL = "http://localhost:8000/api"

def print_header(title):
    print(f"\n{'='*50}\n🚀 DEMO SCENARIO: {title}\n{'='*50}")

def run_scenario_b():
    print_header("Scenario B & C: Compound Risk & Emergency Evacuation")
    print("[1] Simulating normal operations...")
    time.sleep(2)
    
    # 1. Trigger CV Violation (Missing PPE)
    print("[2] Triggering Computer Vision PPE Violation...")
    res = requests.post(f"{BASE_URL}/vision/trigger_mock_detection")
    if res.status_code == 200:
        print(f"  ✅ CV Alert created: {res.json()['alert_uid']}")
    else:
        print("  ❌ Failed to trigger CV alert.")
    
    time.sleep(3)
    
    # 2. Wait for orchestrator to pick it up in risk score
    print("[3] Waiting for backend Risk Engine and Compliance Engine to compound the risk...")
    for i in range(15, 0, -1):
        sys.stdout.write(f"\r  ⏱️ Waiting {i}s for risk broadcast loop... ")
        sys.stdout.flush()
        time.sleep(1)
    print("\n")
    
    print("[4] 🚨 Emergency Orchestrator should now evaluate risk score > 90 and trigger Evacuation.")
    print("  👉 Check the frontend dashboard now! You should see the CRITICAL EVACUATION alert.")
    print("\n✅ Scenario Complete! Record the UI now.")

def run_scenario_d():
    print_header("Scenario D: Compliance Violation Report")
    print("[1] Fetching live compliance report from backend...")
    res = requests.get(f"{BASE_URL}/compliance")
    if res.status_code == 200:
        data = res.json()
        print(f"  ✅ Compliance Score: {data['score']}/100")
        print(f"  🚨 Active Violations: {len(data['violations'])}")
        for v in data['violations']:
            print(f"     - [{v['severity'].upper()}] {v['title']}: {v['description']}")
    else:
        print("  ❌ Failed to fetch compliance report.")

if __name__ == "__main__":
    print("Select a Demo Scenario to run:")
    print("1. Scenario B & C (Compound Risk -> Evacuation Cascade)")
    print("2. Scenario D (Compliance Audit Report)")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ")
    if choice == '1':
        run_scenario_b()
    elif choice == '2':
        run_scenario_d()
    else:
        print("Exiting.")
