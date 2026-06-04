# Quick Start Guide - Pune Metro App

## Project Structure (After Reorganization)

```
PuneMetroApp/
├── frontend/              # React Native mobile app
│   ├── android/          # Android native code
│   ├── ios/              # iOS native code  
│   ├── src/              # React Native source code
│   ├── package.json
│   └── ...
├── backend/              # Node.js/Express API server
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   ├── .env              # Environment variables
│   └── server.js
└── README.md             # Main documentation
```

## Quick Start (5 Steps)

### 1️⃣ Install Dependencies

```bash
# Terminal 1: Backend
cd D:\PuneMetroApp\backend
npm install

# Terminal 2: Frontend
cd D:\PuneMetroApp\frontend
npm install
```

### 2️⃣ Start Backend Server

```bash
cd D:\PuneMetroApp\backend
npm start
```

✅ Should see: "Pune Metro server running on port: 5000"

### 3️⃣ Start Metro Bundler (Terminal 3)

```bash
cd D:\PuneMetroApp\frontend
npm start
```

✅ Should see: "Waiting on ws://localhost:8081/status..."

### 4️⃣ Open Android Studio

- File → Open → `D:\PuneMetroApp\frontend\android`
- Wait for Gradle sync
- Create/select Android Emulator (Device Manager)
- Start emulator

### 5️⃣ Run App on Android

- Click green **Run** button in Android Studio (or `Shift + F10`)
- Or in PowerShell: `cd D:\PuneMetroApp\frontend && npx react-native run-android`

## Key API Endpoints

| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | `/api/auth/login` | POST |
| OTP Verify | `/api/auth/verify-otp` | POST |
| Book Ticket | `/api/tickets/book` | POST |
| Get Fare | `/api/tickets/calculate-fare` | GET |
| Wallet Balance | `/api/wallet/balance` | GET |
| Add Money | `/api/wallet/add-money` | POST |

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://127.0.0.1:27017/punemetro
JWT_SECRET=puneMetroSecretKey2024
REFRESH_TOKEN_SECRET=puneMetroRefreshKey2024
RAZORPAY_KEY_ID=rzp_test_puneMetroKey123
RAZORPAY_KEY_SECRET=puneMetroRazorSecret123
PORT=5000
```

### Frontend
- API URL: `http://10.0.2.2:5000/api` (Android Emulator)
- API URL: `http://localhost:5000/api` (iOS Emulator)
- API URL: `http://<YOUR_IP>:5000/api` (Physical Device)

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "ANDROID_HOME not found" | Set env variable in System Settings |
| "Gradle sync failed" | Run `./gradlew clean` in android folder |
| "Metro bundler already running" | Kill Node process: `Get-Process node \| Stop-Process -Force` |
| "Cannot connect to backend" | Verify backend running on port 5000 |
| "MongoDB connection error" | Ensure MongoDB is running |
| "Blank screen on app" | Check logcat: `adb logcat \| grep 'ReactNative\|ERROR'` |

## Essential Commands

```bash
# Terminal Commands
npm start                      # Start Metro bundler
npm run dev                    # Backend with auto-reload
npm install                    # Install dependencies

# React Native CLI
npx react-native run-android   # Build & run on Android
npx react-native run-ios       # Build & run on iOS
npx react-native start         # Start Metro bundler

# Android CLI
adb devices                    # List connected devices
adb logcat                     # View Android logs
adb shell pm clear com.helloworld  # Clear app data

# Gradle Commands
cd android
./gradlew clean               # Clean build files
./gradlew build               # Build APK
```

## Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 5000 | API server |
| Metro | 8081 | React Native bundler |
| MongoDB | 27017 | Database |

## Testing Credentials

- Email: `test@example.com`
- Password: Any password (auth is in development mode)
- OTP: Any 6-digit number

## Features

✅ User Authentication (Email/OTP)  
✅ Metro Line & Station Selection  
✅ Ticket Booking & QR Code Generation  
✅ Digital Wallet with Balance  
✅ Payment Integration (Razorpay)  
✅ Ticket History & Tracking  
✅ Redux State Management  
✅ Responsive UI Design  

## File Locations

| Important File | Location |
|---|---|
| API Config | `frontend/src/api/axiosConfig.js` |
| Redux Store | `frontend/src/redux/store.js` |
| Auth Routes | `backend/routes/authRoutes.js` |
| Database Config | `backend/config/db.js` |
| Environment | `backend/.env` |
| Screens | `frontend/src/screens/` |

## Debugging Tips

1. **View Backend Logs**: Check terminal where backend is running
2. **View App Logs**: Open Android Logcat in Android Studio
3. **View Network Calls**: Use Redux DevTools or check backend terminal
4. **Enable Debug Menu**: Shake device or press `Ctrl+M` on emulator
5. **Hot Reload**: Press `R` in Metro terminal to reload

## Performance

- **Debug Mode**: Slower, more verbose logging
- **Release Mode**: Faster, optimized build
- **For Testing**: Use debug mode
- **For Performance**: Use release mode

```bash
# Release build
npx react-native run-android --mode release
```

## Useful Resources

- [Main README](README.md) - Detailed documentation
- [Android Setup Guide](ANDROID_SETUP_GUIDE.md) - Complete Android Studio guide
- [React Native Docs](https://reactnative.dev/)
- [Android Studio Docs](https://developer.android.com/studio)

---

## ⚠️ Before Running

- [ ] MongoDB is running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] ANDROID_HOME environment variable set
- [ ] Android SDK installed (API 24+)
- [ ] Android emulator created or device connected
- [ ] Port 5000 is available

## 🚀 You're Ready!

Follow the 5 steps above and your Pune Metro App should be running! 

For detailed troubleshooting, see [ANDROID_SETUP_GUIDE.md](ANDROID_SETUP_GUIDE.md)
