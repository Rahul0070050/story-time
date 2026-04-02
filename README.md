# ✨ StoryTime

StoryTime is a minimal, elegant PDF reader built with React Native and Expo. It automatically discovers your local stories and provides a beautiful reading experience.

## 🚀 Features

-   **Automatic Discovery**: Scans your device for PDF files using modern Android Storage Access Framework (SAF).
-   **Persistent Library**: Found books are saved to your local library for quick access.
-   **Smart Notifications**: A built-in notification system helps you manage file permissions and folder access.
-   **Minimalist UI**: A clean, distraction-free interface focused on your reading material.
-   **Remote & Local Support**: Read PDFs stored on your device or via remote URLs.
-   **Dark Mode Ready**: Built with a deep, modern dark theme by default.

## 🛠️ Tech Stack

-   **Framework**: [Expo](https://expo.dev/) (SDK 54)
-   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
-   **File System**: `expo-file-system` for SAF discovery.
-   **Storage**: `@react-native-async-storage/async-storage` for library persistence.
-   **UI Components**: `expo-linear-gradient`, `expo-image`, and Lucide-style icons via `@expo/vector-icons`.
-   **Animations**: `react-native-reanimated`.

## 📦 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npx expo start
```

### 3. Run on Device

-   **Expo Go**: Download the Expo Go app on [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/app/expo-go/id982107779) and scan the QR code.
-   **Development Build**: To use native features like the device scanner on Android, you can create a development build:
    ```bash
    npx expo run:android
    ```

## 📖 How to Use

1.  **Grant Access**: On the home screen, tap the **Bell Icon** if you see a red dot.
2.  **Select Folder**: Tap the "Folder Access Required" notification and choose the folder where your PDFs are stored (e.g., your Downloads folder).
3.  **Read**: Your PDFs will automatically appear in "My Library". Tap any book to start reading!
4.  **Manage**: Long-press a book in your library to remove it.

## 🏗️ Project Structure

-   `app/`: Expo Router screens and layouts.
-   `src/components/`: Reusable UI components (Library, Reader, UI).
-   `src/hooks/`: Custom hooks for permissions, scanning, and library management.
-   `src/utils/`: Helper functions for PDF handling and data management.
-   `src/constants/`: Theme, colors, and global constants.

---

Built with ❤️ for story lovers.
