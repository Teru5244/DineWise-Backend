import requests
import json
import os
from dotenv import load_dotenv

# Force reload of environment variables
if os.path.exists('.env'):
    print("Loading environment variables from .env file...")
    load_dotenv(override=True)
else:
    print("WARNING: .env file not found!")

# Email configuration
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
print(f"Using EMAIL_ADDRESS: {EMAIL_ADDRESS}")

def test_notification_api():
    """Test the notification API by sending a sample notification request."""
    
    # API endpoint - using port 5002 as configured in main.py
    url = "http://localhost:5002/api/notification"
    
    # Sample notification data
    notification_data = {
        "user_name": "John Doe",
        "restaurant_name": "Delicious Restaurant",
        "reservation_time": "2023-09-15 19:00",
        "table_number": "12",
        "user_email": EMAIL_ADDRESS  # Using the email from .env file
    }
    
    print(f"Testing notification with email: {notification_data['user_email']}")
    
    # Send POST request to the API
    headers = {"Content-Type": "application/json"}
    print(f"Sending request to {url}...")
    
    try:
        response = requests.post(url, data=json.dumps(notification_data), headers=headers)
        
        # Print response
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            print("\nNotification test successful!")
        else:
            print(f"Error response: {response.text}")
            print("\nNotification test failed!")
    except requests.exceptions.ConnectionError:
        print(f"ERROR: Could not connect to {url}")
        print("Make sure the Flask server is running on port 5002")
        print("Run 'python main.py' in a separate terminal window")

if __name__ == "__main__":
    print("Testing Restaurant Notification API...")
    test_notification_api()