import os
from app import create_app

# Get environment from environment variable or default to development
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

# Add more verbose debug output
@app.after_request
def after_request(response):
    # Print request and response information for debugging
    print(f"[DEBUG] {response.status_code} {response.status} - {request.method} {request.path}")
    if response.status_code >= 400:
        print(f"[ERROR] Response data: {response.get_data(as_text=True)}")
    return response

if __name__ == '__main__':
    import logging
    from flask import request
    
    # Set up logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)