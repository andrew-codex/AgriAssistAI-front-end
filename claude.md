# AgriAssistAI - Comprehensive Context Guide

## Project Overview

**AgriAssistAI** is a mobile agricultural assistance application that connects farmers with AI-powered crop diagnosis capabilities and agricultural development advisors (DA Workers). The application enables farmers to diagnose crop diseases through image recognition or text descriptions and receive expert guidance from agricultural professionals.

## Technology Stack

### Frontend (Mobile App)

- **Framework:** React Native 0.81.5 with Expo SDK 54
- **Navigation:** React Navigation v7 (Stack & Bottom Tabs)
- **State Management:** React Context API (AuthContext)
- **UI Components:** Custom components with Expo Vector Icons
- **Image Handling:** Expo Image Picker, Image Manipulator, Expo Image
- **Storage:** Expo Secure Store (tokens), AsyncStorage
- **HTTP Client:** Axios with interceptors
- **Location Services:** Expo Location
- **Styling:** React Native StyleSheet with custom theme system

### Backend API

- Laravel-based REST API
- Token-based authentication (Bearer tokens)
- Base URL: Configured via `.env` file

### Key Dependencies

```json
{
  "expo": "~54.0.32",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@react-navigation/native": "^7.1.26",
  "axios": "^1.13.2",
  "expo-secure-store": "~15.0.8",
  "expo-image-picker": "~17.0.10",
  "expo-location": "~19.0.8"
}
```

## Project Structure

```
AgriAssistAI/
├── App.js                          # Root component with Auth Provider
├── index.js                        # Entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel + dotenv configuration
├── .env                            # Environment variables (API URL)
├── .env.example                    # Environment template
│
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── ButtonPrimary.js       # Primary button component
│   │   ├── ErrorBoundary.js       # Error handling wrapper
│   │   ├── Header.js              # Header component
│   │   ├── InputField.js          # Text input with validation
│   │   └── LoadingSpinner.js      # Loading indicator
│   │
│   ├── config/
│   │   └── config.js              # API configuration & storage URLs
│   │
│   ├── context/
│   │   └── AuthContext.js         # Authentication state management
│   │
│   ├── hooks/
│   │   └── useRefresh.js          # Pull-to-refresh hook
│   │
│   ├── navigation/                # Navigation configuration
│   │   ├── RootNavigator.js      # Main navigator (role-based routing)
│   │   ├── AuthNavigator.js      # Authentication flow
│   │   ├── FarmerNavigator.js    # Farmer tab navigation
│   │   └── DANavigator.js        # DA Worker tab navigation
│   │
│   ├── screens/
│   │   ├── auth/                 # Authentication screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   └── ResetPasswordScreen.js
│   │   │
│   │   ├── farmer/               # Farmer-specific screens
│   │   │   ├── FarmerDashboard.js
│   │   │   ├── UploadDiagnosisScreen.js
│   │   │   ├── DiagnosisResultScreen.js
│   │   │   ├── ReportsScreen.js
│   │   │   ├── ChatScreen.js
│   │   │   └── SupportScreen.js
│   │   │
│   │   ├── da/                   # DA Worker screens
│   │   │   ├── DADashboard.js
│   │   │   ├── CasesScreen.js
│   │   │   ├── CaseDetailScreen.js
│   │   │   └── DAChatScreen.js
│   │   │
│   │   └── common/               # Shared screens
│   │       ├── ProfileScreen.js
│   │       └── SettingsScreen.js
│   │
│   ├── services/                 # API service layer
│   │   ├── api.js               # Axios instance with interceptors
│   │   ├── authService.js       # Login/Register
│   │   ├── diagnosisService.js  # Diagnosis CRUD operations
│   │   ├── chatService.js       # Chat/messaging
│   │   └── messageService.js    # Message handling
│   │
│   ├── styles/
│   │   └── theme.js             # Global theme (colors, fonts, spacing)
│   │
│   └── utils/
│       ├── constants.js         # App constants
│       ├── errorFormatter.js    # Error formatting
│       ├── errorHandler.js      # Error handling utilities
│       └── storage.js           # Storage utilities
│
└── assets/                      # Static assets
    ├── icon.png
    ├── splash-icon.png
    ├── adaptive-icon.png
    ├── favicon.png
    ├── icons/
    └── images/
```

## Key Directories

### `/src/components`

Reusable UI components used throughout the app:

- ButtonPrimary: Styled primary action buttons
- ErrorBoundary: Error handling wrapper component
- Header: Consistent header component
- InputField: Validated text input fields
- LoadingSpinner: Loading state indicator

### `/src/config`

Configuration files for API endpoints and environment settings.

### `/src/context`

React Context providers for global state management:

- AuthContext: User authentication state and methods

### `/src/hooks`

Custom React hooks for reusable logic:

- useRefresh: Pull-to-refresh functionality

### `/src/navigation`

Navigation structure and routing:

- RootNavigator: Role-based routing logic
- AuthNavigator: Unauthenticated user flow
- FarmerNavigator: Farmer-specific tab navigation
- DANavigator: DA Worker-specific tab navigation

### `/src/screens`

All application screens organized by user role:

- auth: Login, registration, password recovery
- farmer: Farmer-facing features
- da: DA Worker-facing features
- common: Shared screens (profile, settings)

### `/src/services`

API communication layer with backend:

- api.js: Configured Axios instance with interceptors
- authService.js: Authentication endpoints
- diagnosisService.js: Crop diagnosis operations
- chatService.js: Messaging functionality
- messageService.js: Message handling

### `/src/styles`

Theme configuration with colors, fonts, spacing, shadows.

### `/src/utils`

Helper functions and utilities for error handling, storage, constants.

## API Endpoints

### Authentication

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/password/otp/request` - Request password reset OTP
- `POST /api/password/otp/reset` - Reset password with OTP

### Diagnosis

- `POST /api/diagnosis` - Submit new diagnosis (image/text/both)
- `GET /api/diagnosis/:id` - Get single diagnosis details
- `GET /api/diagnosis/all-cases` - Get all cases (DA Worker)
- `GET /api/diagnosis/pending-cases` - Get pending cases
- `GET /api/diagnosis/reviewed-cases` - Get reviewed cases
- `POST /api/diagnosis/:id/review` - Submit DA worker review
- `DELETE /api/diagnosis/:id` - Delete diagnosis

### Reports

- `GET /api/my-reports` - Get farmer's diagnosis history
- `GET /api/recent-activities` - Get recent activities for dashboard

### Messaging

- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get conversation with user
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread message count
- `DELETE /api/messages/conversation/:userId` - Delete conversation

### Chat (Alternative)

- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/conversations/:id/read` - Mark as read

### Other

- `GET /api/weather` - Get weather data (lat/long params)
- `GET /api/da-workers` - Get list of DA workers
- `GET /api/da-workers/:id/user` - Get DA worker user info

## Key Features

### Farmer Features

1. **AI Crop Diagnosis** - Three diagnosis modes:
   - Image-based diagnosis (upload photo of crop issue)
   - Text description-based diagnosis
   - Combined (image + text for better accuracy)

2. **Dashboard**:
   - Real-time weather with location-based farming tips
   - Recent diagnosis activities
   - Quick action buttons
   - Location-based weather data

3. **Reports History**:
   - View all past diagnoses
   - Filter by status (all, pending, reviewed)
   - Pagination support
   - Detailed diagnosis information
   - DA worker reviews and recommendations

4. **Chat Support**:
   - Direct messaging with DA workers
   - Start conversations
   - Send text and images
   - View conversation history
   - Swipe-to-delete conversations

5. **Profile Management**:
   - View user information
   - Account details

### DA Worker Features

1. **Dashboard**:
   - Statistics overview (pending, reviewed, total cases)
   - Search and filter functionality
   - Quick access to cases

2. **Case Management**:
   - View all diagnosis submissions
   - Review and provide recommendations
   - Add expert solutions (organic, chemical)
   - Update case status
   - Provide prevention tips

3. **Messaging**:
   - Respond to farmer queries
   - View case-related chats
   - Provide agricultural guidance

### Shared Features

- Authentication (Login/Register with role selection)
- Password Recovery (OTP-based reset)
- Profile viewing
- Secure token storage
- Role-based access control

## Database Models (Inferred from API)

### Users

- id, name, email, password, address
- role: 'farmers' | 'DA_workers'
- created_at, updated_at

### Diagnosis/Detections

- id, user_id, image_path, image_url
- crop_type, diagnosis_mode, category
- specific_issue, disease, confidence_score, severity_level
- status (pending, reviewed)
- solution, organic_solution, chemical_solution
- prevention_tips, description, notes
- reviewer_id, review, recommendation, reviewed_at
- created_at, updated_at

### Messages

- id, sender_id, receiver_id
- content, image_url, detection_id
- is_read
- created_at, updated_at

### DA_Workers

- id, user_id, name, email, address
- created_at, updated_at

### Weather (API Response)

- temp, condition, city
- humidity, wind_speed
- farming_tip

## Application Architecture

### Architecture Pattern

Context API + Services Layer

```
App.js (Root)
  └─ AuthProvider (Global Auth State)
       └─ RootNavigator (Route Based on Auth State)
            │
            ├─ AuthNavigator (Not Logged In)
            │    ├─ LoginScreen
            │    ├─ RegisterScreen
            │    ├─ ForgotPasswordScreen
            │    └─ ResetPasswordScreen
            │
            ├─ FarmerNavigator (Role: farmers)
            │    └─ Bottom Tabs
            │         ├─ Home (Stack)
            │         │    ├─ FarmerDashboard
            │         │    ├─ UploadDiagnosis
            │         │    ├─ DiagnosisResult
            │         │    ├─ Profile
            │         │    └─ Chat
            │         ├─ Diagnose
            │         ├─ Reports
            │         └─ Support
            │
            └─ DANavigator (Role: DA_workers)
                 └─ Bottom Tabs
                      ├─ Dashboard (Stack)
                      │    ├─ DADashboard
                      │    ├─ CaseDetail
                      │    └─ Profile
                      ├─ Cases
                      └─ Messages
```

### Service Layer Architecture

All API calls flow through the service layer:

1. **API Service** (`api.js`):
   - Configured Axios instance
   - Request interceptor: Adds Bearer token from SecureStore
   - Response interceptor: Handles errors, logs in development
   - Automatic 401 handling (redirect to login)

2. **Specialized Services**:
   - authService: Login, register, password reset
   - diagnosisService: CRUD operations for diagnoses
   - chatService/messageService: Messaging functionality

## Authentication Flow

1. User logs in via LoginScreen
2. Backend returns JWT token
3. Token stored in SecureStore (encrypted)
4. AuthContext updates global state
5. RootNavigator redirects to role-specific navigator
6. Axios interceptor automatically adds token to all requests
7. On 401 errors, user is redirected to login

## Environment Setup

### Required Environment Variables (`.env`)

```
API_BASE_URL=http://YOUR_IP_HERE:8000
```

Note: Use your local IP address (not localhost) for testing on physical devices.

### Configuration Files

**`app.json`**: Expo configuration

- App name, slug, version
- Icons and splash screen
- Platform-specific configs
- Plugins: expo-secure-store

**`babel.config.js`**: Babel configuration

- Expo preset
- react-native-dotenv plugin

## Theme System

Located in `src/styles/theme.js`:

**Colors:**

- Primary: #2E7D32 (Green)
- Secondary: #558B2F
- Accent: #FFA726
- White, light shades, text colors
- Error, success, warning states

**Typography:**

- Font sizes: xs (12px) to xxxl (40px)
- Font weights: normal, bold

**Spacing:**

- xs (4px) to xxl (32px)

**Borders:**

- Border radius: sm (4px) to xl (20px)

**Shadows:**

- light, medium, dark presets for elevation

## Special Features

1. **AI-Powered Diagnosis**: Multi-modal input (image, text, or both)
2. **Real-time Weather**: Location-based with farming tips
3. **Role-Based Access Control**: Separate interfaces for farmers/DA workers
4. **Secure Token Storage**: Expo SecureStore encryption
5. **Image Processing**: Camera and gallery integration
6. **Pull-to-Refresh**: Implemented across data screens
7. **Offline-First Design**: Graceful error handling
8. **Messaging System**: Real-time farmer-DA communication
9. **Review System**: Expert recommendations from DA workers
10. **Swipeable Actions**: Delete conversations with swipe gestures
11. **Pagination**: Efficient data loading
12. **Error Boundaries**: Graceful error handling
13. **Form Validation**: Client-side input validation
14. **Responsive Design**: Safe area handling for different devices

## Development Guidelines

### Code Organization

- Keep components small and focused
- Use custom hooks for reusable logic
- Maintain service layer for all API calls
- Follow existing file structure patterns

### State Management

- Use Context API for global state (auth)
- Local state for component-specific data
- Avoid prop drilling

### Error Handling

- Use try-catch in async operations
- Provide user-friendly error messages
- Log errors in development mode
- Use ErrorBoundary for component-level errors

### Security

- Never commit `.env` file
- Use SecureStore for sensitive data
- Validate inputs on both client and server
- Sanitize user-generated content

### Performance

- Use lazy loading where appropriate
- Implement pagination for large datasets
- Optimize images before upload
- Use pull-to-refresh instead of auto-refresh

## Common Tasks

### Adding a New Screen

1. Create screen file in appropriate directory (farmer/da/common)
2. Add route in corresponding navigator
3. Implement screen with consistent styling
4. Add API service call if needed

### Adding a New API Endpoint

1. Add function in appropriate service file (or create new service)
2. Use existing `api` instance from `api.js`
3. Handle errors appropriately
4. Update this guide with new endpoint

### Modifying User Roles

1. Update RootNavigator routing logic
2. Adjust navigation based on new roles
3. Update backend role validation
4. Test role-based access control

### Styling Components

1. Import theme from `src/styles/theme.js`
2. Use theme colors, spacing, fonts
3. Maintain consistent UI patterns
4. Test on multiple device sizes

## Troubleshooting

### Common Issues

**API Connection Failed:**

- Check `.env` file has correct IP address
- Ensure backend server is running
- Verify network connectivity
- Check firewall settings

**Token Expired:**

- Automatic redirect to login should occur
- Check token expiration time on backend
- Verify SecureStore is working

**Image Upload Issues:**

- Check image size limits
- Verify permissions for camera/gallery
- Check multipart/form-data encoding

**Navigation Issues:**

- Verify user role is correctly set
- Check AuthContext state
- Ensure navigation structure is correct

## Git Information

**Current Branch:** main
**Main Branch:** main (for PRs)

**Recent Commits:**

- eb9b795: Final push before deploying
- e9e33c2: Fixing UI issues on different devices
- 4001c78: Removing unused code
- 1905b60: Adding forgot password feature
- ee4f3ae: Adding profile section

## Notes for Development

- Use React Native best practices
- Follow Expo guidelines for managed workflow
- Keep dependencies up to date
- Test on both iOS and Android
- Consider accessibility features
- Document new features in this guide
- Maintain consistent code style
- Write descriptive commit messages

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Laravel API Documentation](https://laravel.com/docs)

---

_Last Updated: Based on codebase snapshot from 2026-02-07_
