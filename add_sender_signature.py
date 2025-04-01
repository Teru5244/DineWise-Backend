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

def add_sender_signature():
    """Add the email address from .env as a Sender Signature in Postmark."""
    
    if not EMAIL_ADDRESS:
        print("ERROR: EMAIL_ADDRESS not found in .env file")
        return False
        
    if not POSTMARK_API_TOKEN:
        print("ERROR: POSTMARK_API_TOKEN not found in .env file")
        return False
    
    print(f"Attempting to add {EMAIL_ADDRESS} as a Sender Signature...")
    
    try:
        # Create Postmark client
        postmark = PostmarkClient(server_token=POSTMARK_API_TOKEN)
        
        # Check if the signature already exists
        signatures = postmark.sender_signatures.all()
        
        for sig in signatures:
            if sig.get('EmailAddress') == EMAIL_ADDRESS:
                print(f"Sender Signature for {EMAIL_ADDRESS} already exists!")
                print(f"Confirmed: {sig.get('Confirmed', False)}")
                
                if not sig.get('Confirmed', False):
                    print("\nYour email address is not confirmed yet.")
                    print("Please check your inbox for a verification email from Postmark.")
                    print("If you don't see it, check your spam folder or request a new verification email.")
                    
                    # Option to resend verification
                    resend = input("Would you like to resend the verification email? (y/n): ")
                    if resend.lower() == 'y':
                        postmark.sender_signatures.resend(sig.get('ID'))
                        print(f"Verification email resent to {EMAIL_ADDRESS}")
                
                return True
        
        # If we get here, the signature doesn't exist yet
        print(f"No existing Sender Signature found for {EMAIL_ADDRESS}")
        
        # Ask for confirmation before adding
        confirm = input(f"Would you like to add {EMAIL_ADDRESS} as a Sender Signature? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled.")
            return False
            
        # Add the signature
        result = postmark.sender_signatures.create(EMAIL_ADDRESS)
        
        print("\nSender Signature added successfully!")
        print(f"A verification email has been sent to {EMAIL_ADDRESS}")
        print("Please check your inbox and click the verification link.")
        
        return True
            
    except Exception as e:
        print(f"Error adding Sender Signature: {e}")
        return False

if __name__ == "__main__":
    add_sender_signature() 