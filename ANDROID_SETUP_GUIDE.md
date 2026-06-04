# Running Pune Metro App in Android Studio - Complete Guide

## Prerequisites Checklist

Before proceeding, ensure you have:

- [ ] Android Studio (latest stable version)
- [ ] Android SDK API Level 24 or higher installed
- [ ] Android SDK Build Tools 36.0.0 or higher
- [ ] Java Development Kit (JDK) 11 or higher
- [ ] Node.js and npm installed
- [ ] Backend server running on port 5000
- [ ] MongoDB running locally or accessible

## Step 1: Verify Environment Setup

### Check Java Installation
Open PowerShell and run:
```powershell
java -version
javac -version
```

You should see Java 11 or higher.

### Check Android SDK Installation
In Android Studio, go to:
- **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**

Ensure the following are installed:
- **Android SDK Platforms**: API 36 (or your targetSdkVersion)
- **Android SDK Tools**: Latest versions
- **Android Emulator**
- **Android SDK Build Tools**: 36.0.0 or higher

### Set ANDROID_HOME Environment Variable

1. Find your Android SDK location (usually `C:\Users\YourUsername\AppData\Local\Android\Sdk`)
2. Open System Environment Variables:
   - Press **Windows Key** → Type "Environment Variables" → Click "Edit the system environment variables"
   - Click **Environment Variables** button
   - Click **New** under "System variables"
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Click **OK** and apply

3. Add to PATH:
   - Click on **Path** → **Edit**
   - Add these paths:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
   - Click **OK** and apply

## Step 2: Start the Backend Server

In PowerShell, navigate to the backend folder and start the server:

```powershell
cd D:\PuneMetroApp\backend
npm install    # If not already installed
npm start      # Or npm run dev for development mode
```

You should see:
```
===========================================
Pune Metro server running on port: 5000
Database target URI configured.
===========================================
```

**Keep this terminal open!** The backend must be running for the app to work.

## Step 3: Install Frontend Dependencies

In a new PowerShell terminal:

```powershell
cd D:\PuneMetroApp\frontend
npm install
```

This will install all React Native and JavaScript dependencies, which may take 5-10 minutes.

## Step 4: Open Project in Android Studio

1. **Launch Android Studio**
2. Click **File** → **Open**
3. Navigate to `D:\PuneMetroApp\frontend\android`
4. Click the **android** folder and select **Open**
5. Android Studio will prompt to load the project - click **Trust Project** if asked
6. Wait for Gradle to sync (usually 2-5 minutes)

### Monitor Gradle Sync
- Look at the bottom of Android Studio for sync progress
- You should see "Gradle sync finished" message
- If there are errors, see the Troubleshooting section below

## Step 5: Create or Select Android Emulator

### Option A: Using Android Emulator

1. In Android Studio, click **Device Manager** (on the right side)
2. Click **Create Device**
3. Select a device profile (e.g., "Pixel 4a")
4. Choose an API level (API 24 or higher)
5. Click **Next** and **Finish**
6. Back in Device Manager, click the **Play** button to start the emulator

Wait for the emulator to fully boot (may take 1-2 minutes).

### Option B: Using Physical Device

1. Enable USB Debugging on your Android device:
   - Go to **Settings** → **Developer Options** → Enable **USB Debugging**
2. Connect your device via USB cable
3. In Android Studio, your device should appear in the device list

## Step 6: Run the App

### Method 1: Using Android Studio UI

1. In Android Studio, select the running emulator/device from the device dropdown (top menu bar)
2. Click the green **Run** button (play icon) or press `Shift + F10`
3. Select "com.helloworld" when prompted
4. Wait for the build to complete and app to launch

### Method 2: Using Command Line

In the frontend folder:

```powershell
cd D:\PuneMetroApp\frontend
npx react-native run-android
```

This will:
- Start the Metro bundler
- Build the APK
- Install it on the emulator/device
- Launch the app

## Step 7: Verify App is Running

When the app launches, you should see:
- Splash screen with metro logo
- Login screen with email/password fields
- OTP entry screen after login attempt

## Troubleshooting

### Error: "ANDROID_HOME not found"

**Solution:**
1. Set the `ANDROID_HOME` environment variable (see Step 1)
2. Restart Android Studio and PowerShell
3. In Android Studio, go to **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK** and verify SDK Path

### Error: "SDK location not found"

**Solution:**
1. Create `local.properties` file in `frontend/android/` with:
   ```
   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```
   (Note: Use double backslashes for Windows paths)

### Error: "Gradle build failed"

**Solutions:**
```powershell
# Clean and rebuild
cd D:\PuneMetroApp\frontend\android
./gradlew clean
./gradlew build

# Or from root if gradlew commands don't work
cd D:\PuneMetroApp\frontend
npx react-native run-android -- --no-jetifier
```

### Error: "Metro bundler already running on port 8081"

**Solution:**
```powershell
# Kill the process using port 8081
Get-Process node | Stop-Process -Force
# or
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### App crashes on startup or shows "API Error"

**Solution:**
1. Verify backend is running: `http://localhost:5000`
2. Check backend is on correct port in `.env` file
3. Verify MongoDB is running
4. Check API URL in `frontend/src/api/axiosConfig.js` is correct: `http://10.0.2.2:5000/api`

### Blank screen or "Cannot connect to server"

**Solution:**
1. Ensure backend is running
2. In emulator, verify network connectivity
3. For physical device, ensure both device and computer are on the same network
4. Update API URL if needed based on your network setup

### Hot Reload Not Working

**Solution:**
1. Press `r` in Metro bundler terminal to reload
2. Press `d` to open developer menu in emulator
3. Select "Reload"

### Build Takes Too Long

**Solutions:**
```powershell
# Disable Hermes or use faster build variants
cd D:\PuneMetroApp\frontend
npx react-native run-android --mode release
```

## Network Configuration for Physical Device

If using a physical device instead of emulator:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   # Look for "IPv4 Address" (usually like 192.168.x.x)
   ```

2. Update the API URL in `frontend/src/api/axiosConfig.js`:
   ```javascript
   baseURL: 'http://YOUR_IP_ADDRESS:5000/api'
   ```

3. Ensure both device and computer are on the same Wi-Fi network

## Database Initialization

On first run, the app will create necessary database collections. If you need to seed data:

```powershell
cd D:\PuneMetroApp\backend
node test-flow.js
```

## Development Workflow

### Making Code Changes

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Save the file
3. Metro bundler will automatically reload
4. App will hot-reload on device/emulator

**Backend Changes:**
1. Edit files in `backend/`
2. If using `npm run dev`, server will auto-reload with nodemon
3. If using `npm start`, restart the terminal

### Viewing Logs

**Frontend Logs:**
```powershell
cd D:\PuneMetroApp\frontend
npm start -- --reset-cache
```

**Android Device Logs:**
In Android Studio: **Logcat** tab at the bottom

## Useful Commands

```powershell
# Start Metro bundler manually
cd D:\PuneMetroApp\frontend
npm start

# Build APK for release
cd D:\PuneMetroApp\frontend
npx react-native run-android --mode release

# Install app without running
npx react-native run-android --no-launch

# List available devices
adb devices

# Clear app cache
adb shell pm clear com.helloworld
```

## Next Steps

1. **Test Login**: Use any credentials (dummy auth or register new user)
2. **Explore Features**: Navigate through ticket booking, wallet, history
3. **Check Console**: Open Browser DevTools if running on web
4. **Monitor Backend**: Check backend terminal for API calls

## Performance Tips

1. **Use Release Build** for better performance:
   ```powershell
   npx react-native run-android --mode release
   ```

2. **Disable Debug**: In Debug Menu (shake phone), turn off "Debug JS Remotely"

3. **Use Physical Device** if possible (emulator can be slow)

## Security Notes

⚠️ **Development Only Configuration**:
- The `.env` file contains test keys and credentials
- Never commit sensitive data to version control
- Use strong secrets in production
- Update Razorpay keys with actual test keys from your dashboard

## Support & Documentation

- [React Native Docs](https://reactnative.dev/)
- [Android Studio Docs](https://developer.android.com/studio)
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)

---

**If you encounter any issues not covered here, check the main README.md or create an issue with error details.**
