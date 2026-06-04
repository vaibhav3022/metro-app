# Pune Metro App

A React Native mobile application for booking metro tickets in Pune, with a Node.js/Express backend.

## Project Structure

```
PuneMetroApp/
├── frontend/                 # React Native Frontend Application
│   ├── src/                  # Source code
│   │   ├── api/              # API calls and axios configuration
│   │   ├── components/       # Reusable components
│   │   ├── constants/        # App constants (colors, fonts, etc.)
│   │   ├── navigation/       # Navigation setup (React Navigation)
│   │   ├── redux/            # Redux store and slices
│   │   ├── screens/          # Screen components
│   │   └── utils/            # Utility functions
│   ├── android/              # Android native code
│   ├── ios/                  # iOS native code
│   ├── App.js                # Root component
│   ├── index.js              # Entry point
│   ├── package.json          # Frontend dependencies
│   ├── babel.config.js       # Babel configuration
│   └── metro.config.js       # Metro bundler configuration
│
└── backend/                  # Node.js/Express Backend
    ├── config/               # Database configuration
    ├── controllers/          # Route controllers
    ├── middleware/           # Express middleware
    ├── models/               # Mongoose models
    ├── routes/               # API routes
    ├── utils/                # Utility functions
    ├── server.js             # Main server file
    ├── package.json          # Backend dependencies
    └── .env                  # Environment variables
```

## Prerequisites

Before running this project, ensure you have installed:

### For Frontend (React Native):
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Android Studio** (for Android development)
- **Android SDK** (API level 24 or higher)
- **JDK** (Java Development Kit - v11 or higher)

### For Backend:
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm**

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
# or
yarn install
```

### 3. Backend Configuration

Create or verify `.env` file in the `backend/` directory with the following variables:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/punemetro
JWT_SECRET=puneMetroSecretKey2024
REFRESH_TOKEN_SECRET=puneMetroRefreshKey2024
RAZORPAY_KEY_ID=rzp_test_puneMetroKey123
RAZORPAY_KEY_SECRET=puneMetroRazorSecret123
PORT=5000
```

## Running the Project

### Running Backend Server

```bash
cd backend
npm start          # Production mode
# or
npm run dev       # Development mode with nodemon
```

The backend will start on `http://localhost:5000`

### Running Frontend on Android

#### Option 1: Using Android Studio

1. Open Android Studio
2. Click **File** → **Open** → Navigate to `frontend/android` → Click **Open**
3. Wait for Android Studio to load the project and sync Gradle files
4. Ensure an Android emulator is running or a physical device is connected
5. Click the **Run** button (green play icon) or press `Shift + F10`

#### Option 2: Using Command Line

```bash
cd frontend
npm start                    # Start Metro bundler
# In a new terminal:
npx react-native run-android
```

### Running Frontend on iOS (macOS only)

```bash
cd frontend
npm install -g ios-deploy  # Install if not already installed
npx react-native run-ios
```

## Important Notes

### Android Emulator API Configuration

The frontend uses `http://10.0.2.2:5000/api` to communicate with the backend when running in the Android emulator. This special IP address maps to `localhost` on the host machine.

- **For Android Emulator**: Use `http://10.0.2.2:5000/api`
- **For Physical Device**: Use `http://<YOUR_COMPUTER_IP>:5000/api` (requires updating `axiosConfig.js`)
- **For iOS Emulator**: Use `http://localhost:5000/api`

### Environment Variables

Update the base URL in `frontend/src/api/axiosConfig.js` if your backend is running on a different address.

## Features

- **User Authentication**: Login and OTP-based verification
- **Ticket Booking**: Select metro lines, stations, and book tickets
- **QR Code Generation**: Generate QR codes for booked tickets
- **Wallet Management**: Load money into wallet and track balance
- **Payment Integration**: Razorpay integration for secure payments
- **Ticket History**: View booking history and past transactions

## Technology Stack

### Frontend
- React Native 0.85.3
- Redux Toolkit
- React Navigation
- Axios
- Razorpay SDK

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Razorpay API

## Troubleshooting

### Metro Bundler Issues
```bash
cd frontend
npm start -- --reset-cache
```

### Gradle Build Issues
```bash
cd frontend/android
./gradlew clean
./gradlew build
```

### MongoDB Connection Issues
Ensure MongoDB is running:
```bash
# On Windows
mongod

# On macOS/Linux
brew services start mongodb-community
```

### Port Already in Use
If port 5000 is already in use, change it in `backend/.env`:
```env
PORT=3000
```

Then update the API base URL in `frontend/src/api/axiosConfig.js`:
```javascript
baseURL: 'http://10.0.2.2:3000/api'
```

## Cloud Deployment (Production)

### Backend Deployment (Render / Heroku / AWS)

1. **Environment Variables**:
   In your cloud provider's dashboard, set the following environment variables exactly as in `.env.example`:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A strong random string for JWT.
   - `REFRESH_TOKEN_SECRET`: A strong random string for refresh tokens.
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Your live Razorpay credentials.
   - `STRIPE_SECRET_KEY`: Your live Stripe secret key.

2. **MongoDB Atlas Setup**:
   Ensure you create a cluster on MongoDB Atlas, add your server's IP address (or allow all IPs `0.0.0.0/0`) in Network Access, and get the connection string.

3. **Start Command**:
   Use `npm start` to run the server in production mode.

### Frontend Deployment

1. **Android (Google Play Store)**:
   - Generate a release keystore.
   - Update `android/app/build.gradle` with signing configurations.
   - Run `./gradlew assembleRelease` or `./gradlew bundleRelease` in the `android` directory.
   - Note: Update `API_BASE_URL` in `src/api/axiosConfig.js` to your deployed backend URL (e.g., `https://api.punemetro.com/api`) before building!

## License

This project is licensed under MIT License.

## Support

For issues or questions, please create an issue in the repository.
