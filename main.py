from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from postmarker.core import PostmarkClient

# Force reload of environment variables
if os.path.exists('.env'):
    print("Loading environment variables from .env file...")
    load_dotenv(override=True)
else:
    print("WARNING: .env file not found!")

app = Flask(__name__)

# Email configuration
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
POSTMARK_API_TOKEN = os.getenv("POSTMARK_API_TOKEN")

print(f"Using EMAIL_ADDRESS: {EMAIL_ADDRESS}")

def send_confirmation_email(user_name, restaurant_name, reservation_time, table_number, user_email):
    """Send a confirmation email to the user using Postmark."""
    
    print(f"Attempting to send email to {user_email}...")
    
    # Extract domains
    sender_domain = EMAIL_ADDRESS.split('@')[1]
    recipient_domain = user_email.split('@')[1]
    
    # Check if domains match (required for new Postmark accounts)
    if sender_domain != recipient_domain:
        print(f"WARNING: Postmark requires matching domains for new accounts.")
        print(f"Sender domain: {sender_domain}, Recipient domain: {recipient_domain}")
        print(f"Using {EMAIL_ADDRESS} as recipient for testing instead.")
        # For testing, send to yourself instead
        user_email = EMAIL_ADDRESS
    
    # Create email message content
    subject = f"Reservation Confirmation - {restaurant_name}"
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 10px; text-align: center; }}
            .content {{ padding: 20px; }}
            .footer {{ background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Reservation Confirmation</h2>
            </div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>Your reservation at <strong>{restaurant_name}</strong> has been confirmed!</p>
                <h3>Reservation Details:</h3>
                <ul>
                    <li><strong>Date and Time:</strong> {reservation_time}</li>
                    <li><strong>Table Number:</strong> {table_number}</li>
                </ul>
                <p>Thank you for your reservation. We look forward to serving you!</p>
                <p>Best regards,<br>{restaurant_name} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version for email clients that don't support HTML
    text_content = f"""
    Hello {user_name},
    
    Your reservation at {restaurant_name} has been confirmed!
    
    Reservation Details:
    - Date and Time: {reservation_time}
    - Table Number: {table_number}
    
    Thank you for your reservation. We look forward to serving you!
    
    Best regards,
    {restaurant_name} Team
    """
    
    try:
        # Create Postmark client
        postmark = PostmarkClient(server_token=POSTMARK_API_TOKEN)
        
        # Send email using Postmark
        response = postmark.emails.send(
            From=EMAIL_ADDRESS,
            To=user_email,
            Subject=subject,
            HtmlBody=html_content,
            TextBody=text_content,
            MessageStream='outbound'
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

@app.route('/api/notification', methods=['POST'])
def send_notification():
    """API endpoint to handle restaurant notifications."""
    
    # Get notification data from request
    data = request.json
    
    # Validate required fields
    required_fields = ['user_name', 'restaurant_name', 'reservation_time', 'table_number', 'user_email']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Extract notification details
    user_name = data['user_name']
    restaurant_name = data['restaurant_name']
    reservation_time = data['reservation_time']
    table_number = data['table_number']
    user_email = data['user_email']
    
    # Send confirmation email
    email_sent = send_confirmation_email(
        user_name, 
        restaurant_name, 
        reservation_time, 
        table_number, 
        user_email
    )
    
    if email_sent:
        # In a real application, you would save the notification to a database here
        return jsonify({
            "status": "success",
            "message": "Notification sent successfully",
            "notification": {
                "user_name": user_name,
                "restaurant_name": restaurant_name,
                "reservation_time": reservation_time,
                "table_number": table_number,
                "user_email": user_email
            }
        })
    else:
        return jsonify({
            "status": "partial_success",
            "message": "Reservation confirmed but failed to send notification"
        }), 500

@app.route('/', methods=['GET'])
def home():
    """Home endpoint to verify the API is running."""
    return jsonify({
        "status": "online",
        "message": "Restaurant Notification API is running",
        "endpoints": {
            "/api/notification": "POST - Send a notification"
        }
    })

if __name__ == '__main__':
    # Use a different port if 5001 is already in use
    port = 5002
    print(f"Starting server on port {port}...")
    app.run(debug=True, port=port)