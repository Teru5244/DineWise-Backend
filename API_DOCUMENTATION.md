# Restaurant Notification API Documentation

This document provides instructions on how to use the Restaurant Notification API to make reservations and receive confirmation emails.

## API Endpoint

```
POST http://localhost:5002/api/notification
```

## Request Format

The API accepts JSON requests with the following structure:

```json
{
  "user_name": "John Doe",
  "restaurant_name": "Delicious Restaurant",
  "reservation_time": "2023-09-15 19:00",
  "table_number": "12",
  "user_email": "example@domain.com"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_name` | String | The name of the person making the reservation |
| `restaurant_name` | String | The name of the restaurant |
| `reservation_time` | String | The date and time of the reservation (format: "YYYY-MM-DD HH:MM") |
| `table_number` | String | The table number for the reservation |
| `user_email` | String | The email address where the confirmation will be sent |

## Response Format

### Successful Response (200 OK)

```json
{
  "status": "success",
  "message": "Notification sent successfully",
  "notification": {
    "user_name": "John Doe",
    "restaurant_name": "Delicious Restaurant",
    "reservation_time": "2023-09-15 19:00",
    "table_number": "12",
    "user_email": "example@domain.com"
  }
}
```

### Partial Success Response (500 Internal Server Error)

If the reservation is processed but the confirmation email fails to send:

```json
{
  "status": "partial_success",
  "message": "Reservation confirmed but failed to send notification"
}
```

### Error Response (400 Bad Request)

If required fields are missing:

```json
{
  "error": "Missing required field: field_name"
}
```

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:5002/api/notification \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "John Doe",
    "restaurant_name": "Delicious Restaurant",
    "reservation_time": "2023-09-15 19:00",
    "table_number": "12",
    "user_email": "example@uwaterloo.ca"
  }'
```

### Using Python with Requests

```python
import requests
import json

url = "http://localhost:5002/api/notification"

notification_data = {
    "user_name": "John Doe",
    "restaurant_name": "Delicious Restaurant",
    "reservation_time": "2023-09-15 19:00",
    "table_number": "12",
    "user_email": "example@uwaterloo.ca"
}

headers = {"Content-Type": "application/json"}
response = requests.post(url, data=json.dumps(notification_data), headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Using JavaScript/Fetch API

```javascript
fetch('http://localhost:5002/api/notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_name: "John Doe",
    restaurant_name: "Delicious Restaurant",
    reservation_time: "2023-09-15 19:00",
    table_number: "12",
    user_email: "example@uwaterloo.ca"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Email Confirmation

When a notification is successfully processed, the API sends a confirmation email to the provided `user_email` address. The email contains:

- Reservation details (restaurant name, time, table number)
- A confirmation message
- Contact information for the restaurant

**Note for Testing**: If you're using a new Postmark account, emails can only be sent to recipients with the same domain as the sender until the account is approved. The API automatically handles this by redirecting test emails to the sender's address.

## Running the API Server

To start the API server:

```bash
python main.py
```

The server will start on port 5002 by default.

## Troubleshooting

1. **Port Already in Use**: If port 5002 is already in use, you can modify the port in `main.py`.

2. **Email Sending Issues**: If emails are not being received, check:
   - The Postmark account status
   - Sender Signature verification
   - Domain restrictions for new accounts

3. **Connection Errors**: Ensure the server is running before making API calls.

For more detailed testing, you can use the provided test scripts:
- `test_api.py`: Tests the API endpoint
- `test_postmark.py`: Tests email sending directly
- `add_sender_signature.py`: Helps set up Postmark Sender Signatures
- `test_all.py`: Runs a comprehensive test of all components 