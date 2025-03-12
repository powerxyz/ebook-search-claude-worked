This is the OLD version of README file, the updated version of project structure is in the NEW README.md file. But this file also contains some import details of setting-up the project.

# PowerXYZ Ebook Search Application

A web-based application for searching and reading ebooks from a local library collection.

## Features

- 🔐 User authentication and personalized experience
- 🔍 Search functionality across PDF, EPUB, and AZW3 ebook formats
- 📚 In-browser ebook viewing with plugin recommendations
- 📊 Search history tracking and management
- 💾 SQLite database for local storage

## Project Structure

```
powerxyz-ebook-search/
├── backend/              # Flask backend
│   ├── app/
│   │   ├── __init__.py   # Flask app initialization
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions
│   ├── config.py         # Configuration settings
│   └── run.py            # Application entry point
├── frontend/             # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main application component
│   │   └── index.tsx     # Application entry point
│   └── package.json      # Node.js dependencies
├── library/              # Ebook library directory
├── instance/             # SQLite database location
├── requirements.txt      # Python dependencies
├── run.sh                # Unix/macOS launch script
├── run.bat               # Windows launch script
└── README.md             # Project documentation
```

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Quick Start

The easiest way to start the application is to use the provided scripts:

#### On Unix/macOS:

```bash
# Make the script executable
chmod +x run.sh

# Run the application
./run.sh
```

#### On Windows:

```cmd
# Run the application
run.bat
```

The scripts will:
1. Set up a Python virtual environment if not already present
2. Install Python dependencies
3. Create the necessary directories if they don't exist
4. Start the Flask backend server
5. Install Node.js dependencies if not already present
6. Start the React frontend development server

After running the script, you can access the web application at `http://localhost:3000`.

### Manual Setup

If you prefer to set up the application manually:

#### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/macOS: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the instance directory for SQLite:
   ```bash
   mkdir instance
   ```

5. Run the backend:
   ```bash
   python backend/run.py
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Adding Books to the Library

1. Create a directory called `library` in the project root if it doesn't exist already.
2. Add your ebook files (PDF, EPUB, AZW3) directly to the `library` directory or organize them in subdirectories.
3. After logging in to the application, use the "Scan Library" button to index your books.

## Usage

1. Register a new account or log in with existing credentials.
2. Click "Scan Library" to index your ebook collection.
3. Use the search bar to find books by title, author, or content.
4. Click on a book to view its details.
5. Choose to download the book or read it in the browser.
6. Access your search history from the "History" page.

## Browser Compatibility

The application is designed to work with modern browsers:
- Chrome
- Firefox
- Safari
- Edge

For optimal ebook viewing experience:
- PDF files can be viewed directly in the browser without additional plugins.
- EPUB files might require a browser extension like "EPUBReader" for Chrome or Firefox.
- AZW3 files (Amazon Kindle format) typically need to be downloaded and viewed in specialized applications like Calibre or the Kindle app.

## Security

- User passwords are securely hashed before storage.
- JWTs (JSON Web Tokens) are used for authentication.
- The application is designed for personal or local network use. Additional security measures should be implemented for public-facing deployments.

## Customization

### Environment Variables

The following environment variables can be set to customize the application:

- `FLASK_ENV`: Set to `development`, `testing`, or `production` (default: `development`)
- `SECRET_KEY`: Flask secret key for session security (default: a development key)
- `JWT_SECRET_KEY`: Secret key for JWT token generation (default: a development key)
- `DATABASE_URI`: SQLite database URI (default: `sqlite:///ebook_search.db`)
- `LIBRARY_PATH`: Path to the ebook library directory (default: `library/` in the project root)

### Database

The application uses SQLite by default. The database file will be created in the `instance/` directory when the application first runs.

## Troubleshooting

### Backend Issues

- **Database errors**: If you encounter database errors, try deleting the `instance/ebook_search.db` file and restarting the application to create a fresh database.
- **Library not found**: Ensure the `library` directory exists and has proper read permissions.

### Frontend Issues

- **Connection refused**: Ensure the backend server is running on port 5000.
- **Authentication issues**: If you're logged in but see authentication errors, try logging out and back in to refresh your token.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flask for the backend framework
- React and Material-UI for the frontend
- PyPDF2 and ebooklib for ebook processing
- NLTK for text processing and search functionality