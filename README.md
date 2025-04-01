# Restaurant Notification System

A simple API for managing restaurant notifications with email confirmations using Postmark.

## Features

- Send restaurant notifications via API
- Send confirmation emails to customers
- Beautiful HTML email templates
- Robust error handling

## Setup

### Prerequisites

- Python 3.6+

### Installation

1. Create and activate a virtual environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage
### Starting the Server

```
python main.py
```

The server will start on port 5002 by default.

### Sending Notifications

Send a POST request to the API endpoint:

```
POST http://localhost:5002/api/notification
```

With a JSON body:

```json
{
  "user_name": "John Doe",
  "restaurant_name": "Delicious Restaurant",
  "reservation_time": "2023-09-15 19:00",
  "table_number": "12",
  "user_email": "customer@uwaterloo.ca"
}
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API usage.

## Testing

Several test scripts are provided:

- `test_postmark.py`: Test email sending directly
- `test_api.py`: Test the notification API
- `check_postmark_status.py`: Check your Postmark account status
- `add_sender_signature.py`: Add and verify your email as a Sender Signature

Example:
```
python test_api.py
```

## Email Templates

The system sends beautifully formatted HTML emails with:
- Reservation details
- Restaurant information
- Confirmation message