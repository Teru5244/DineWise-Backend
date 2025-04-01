import os
from dotenv import load_dotenv
from postmarker.core import PostmarkClient

# Force reload of environment variables
if os.path.exists('.env'):
    print("Loading environment variables from .env file...")
    load_dotenv(override=True)
else:
    print("WARNING: .env file not found!")

# Email configuration
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
POSTMARK_API_TOKEN = os.getenv("POSTMARK_API_TOKEN")

print(f"Using EMAIL_ADDRESS: {EMAIL_ADDRESS}")

def test_postmark_email():
    """Test sending an email using Postmark."""
    
    # Extract domain from sender email
    sender_domain = EMAIL_ADDRESS.split('@')[1]
    print(f"Sender domain: {sender_domain}")
    
    # Use the same domain for recipient (for new Postmark accounts)
    # If your EMAIL_ADDRESS is example@gmail.com, this will use example@gmail.com as recipient
    recipient_email = EMAIL_ADDRESS  # Use same email as sender for testing
    
    print("Testing Postmark email sending...")
    print(f"From: {EMAIL_ADDRESS}")
    print(f"To: {recipient_email}")
    
    try:
        # Create Postmark client
        postmark = PostmarkClient(server_token=POSTMARK_API_TOKEN)
        
        # Send a test email
        response = postmark.emails.send(
            From=EMAIL_ADDRESS,
            To=recipient_email,
            Subject="Test Email from Postmark",
            HtmlBody="<html><body><h1>Test Email</h1><p>This is a test email sent using Postmark.</p></body></html>",
            TextBody="This is a test email sent using Postmark.",
            MessageStream="outbound"
        )
        
        # Log the response
        print(f"Postmark Message ID: {response.get('MessageID', 'N/A')}")
        print(f"Postmark Message: {response.get('Message', 'N/A')}")
        print(f"Postmark Error Code: {response.get('ErrorCode', 'N/A')}")
        
        if response.get('ErrorCode', 1) == 0:
            print("Email sent successfully via Postmark!")
            return True
        else:
            print(f"Postmark returned error: {response.get('Message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"Error sending email via Postmark: {e}")
        return False

if __name__ == "__main__":
    test_postmark_email() 