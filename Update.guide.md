# AgriAssistAI — Update Guide
# Codebase Audit & Fix Plan (Demo Stability — 1 Month)
# Generated: February 19, 2026

═══════════════════════════════════════════════════════════════
## PRIORITY LEGEND
  🔴 CRITICAL  — Will crash the app or break core flows
  🟠 HIGH      — Features may fail under normal demo use
  🟡 MEDIUM    — UX problems, inconsistencies, security
  🟢 LOW       — Code quality, minor polish
═══════════════════════════════════════════════════════════════


────────────────────────────────────────────────────────────────
## 🔴 CRITICAL ISSUES (7)
────────────────────────────────────────────────────────────────

### C1. React Hooks Called After Early Return — ChatScreen WILL CRASH
- File: src/screens/farmer/ChatScreen.js (~L48-73)
- Problem: `useState`, `useRef`, `useRefresh` hooks are declared AFTER a
  conditional early return. React requires hooks in the same order every render.
- Symptom: App crashes with "Rendered more hooks than during the previous render"
  when navigating to Chat without params, then back with params.
- Fix: Move ALL hook declarations above the early return. Use the params
  in conditional logic below the hooks instead.

### C2. Missing `borderRadius.full` in Theme
- File: src/styles/theme.js
- Used in: ChatScreen.js, CaseDetailScreen.js
- Problem: Theme defines sm/md/lg/xl/round but code references `borderRadius.full`
  which is `undefined`. Avatar circles won't render correctly.
- Fix: Add `full: 9999` to the `borderRadius` object in theme.js

### C3. Missing `shadows.sm` and `shadows.lg` in Theme
- Files: CaseDetailScreen.js, CasesScreen.js, DADashboard.js
- Problem: Theme defines shadows.light/medium/dark but code spreads `...shadows.sm`
  and `...shadows.lg` which are `undefined`. Shadow effects silently disappear.
- Fix: Add to theme.js:
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }

### C4. Missing `colors.lightGray` in Theme
- Files: CaseDetailScreen.js, CasesScreen.js
- Problem: Theme has `colors.grayLight` but code uses `colors.lightGray` (wrong name).
  Backgrounds render as transparent.
- Fix: Add `lightGray: '#D3D3D3'` to colors in theme.js, OR rename usages to
  `colors.grayLight` to match existing theme.

### C5. `api.uploadFile()` Does Not Exist — Chat Attachment Upload Crashes
- File: src/services/chatService.js (~L82)
- Problem: Calls `api.uploadFile(...)` but api.js has no such method.
  Throws `TypeError: api.uploadFile is not a function`.
- Fix: Either implement `uploadFile` in api.js as a method that POSTs with
  multipart/form-data headers, or remove the attachment feature from chatService.
  Note: chatService.js is currently dead code (no screen imports it), so lowest
  priority among criticals.

### C6. `crop.icon` Is Undefined — Crop Picker Renders Broken Icons
- File: src/screens/farmer/UploadDiagnosisScreen.js (~L67-76, L502)
- Problem: Crop types array defines `{ id, label }` but the dropdown renders
  `<MaterialCommunityIcons name={crop.icon}>`. `crop.icon` is `undefined`.
- Fix: Add icon names to each crop type object:
    { id: 'wheat', label: 'Wheat', icon: 'wheat' }
    { id: 'corn', label: 'Corn', icon: 'corn' }
    etc.
  OR remove the icon rendering from the dropdown.

### C7. No 401 Token Expiration Handling — Users Get Stuck After Token Expires
- File: src/services/api.js (~L30-44)
- Problem: Response interceptor logs 401 errors but does NOT clear token or
  redirect to login. Over 1 month, tokens WILL expire. User remains stuck on
  authenticated screens with every API call silently failing.
- Fix: In the response error interceptor, add:
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      // Signal AuthContext to reset (emit event or call logout)
    }
  Best approach: import a navigation ref and reset to Auth stack on 401.


────────────────────────────────────────────────────────────────
## 🟠 HIGH ISSUES (8)
────────────────────────────────────────────────────────────────

### H1. Deprecated ImagePicker.MediaTypeOptions API
- File: src/screens/farmer/ChatScreen.js (~L281)
- Problem: Uses `ImagePicker.MediaTypeOptions.Images` (old enum).
  Expo image-picker v17 uses `mediaTypes: ['images']`.
  UploadDiagnosisScreen.js already uses the correct new API.
- Fix: Change to `mediaTypes: ['images']`

### H2. fetchReports Has Stale Closure Over `reports` State
- File: src/screens/farmer/ReportsScreen.js (~L173-195)
- Problem: `useCallback` depends on `reports` state which changes every call,
  causing re-creation loops. Pagination append uses stale value.
- Fix: Use functional updater:
    setReports(prev => page === 1 ? items : [...prev, ...items])
  Remove `reports` from useCallback dependency array.

### H3. Double fetchReports() Call on Initial Mount
- File: src/screens/farmer/ReportsScreen.js (~L198-207)
- Problem: Two useEffects both fire fetchReports(1) on mount — duplicate API
  calls and potential race condition.
- Fix: Remove the standalone `useEffect(() => { fetchReports(1); }, [])` and
  let the filter useEffect handle both initial load and filter changes.

### H4. ForgotPasswordScreen / ResetPasswordScreen Import Style
- Files: src/screens/auth/ForgotPasswordScreen.js (~L14),
         src/screens/auth/ResetPasswordScreen.js (~L17)
- Problem: `import * as api from "../../services/api"` imports the default
  Axios instance AND named exports together. Works but confusing.
- Fix: Use `import { forgotPasswordRequest } from "../../services/api"`
  for named imports only.

### H5. No Chat Polling — Messages Don't Update in Real Time
- File: src/screens/farmer/ChatScreen.js
- Problem: Messages load once on mount and only refresh on manual pull-to-refresh.
  Demo users will think chat is broken.
- Fix: Add a polling interval (every 10-15 seconds):
    useEffect(() => {
      const interval = setInterval(() => fetchMessages(), 15000);
      return () => clearInterval(interval);
    }, []);

### H6. Auto-Sends Initial Message on Empty Conversations
- File: src/screens/farmer/ChatScreen.js (~L175-195)
- Problem: When conversation is empty, code auto-generates and sends a message
  to the server. Creates unsolicited messages; if API fails, phantom messages
  appear locally.
- Fix: Show a placeholder UI ("Start the conversation!") instead of auto-sending.

### H7. tempMsg Scoping Issue in Catch Block
- File: src/screens/farmer/ChatScreen.js (~L255-272)
- Problem: `tempMsg` is declared with `const` inside try block. If error occurs
  before `tempMsg` creation, catch block crashes on `tempMsg.id`.
- Fix: Declare `let tempMsg` before the try block, or add a null check in catch:
    if (tempMsg) { setMessages(prev => prev.filter(m => m.id !== tempMsg.id)); }

### H8. Duplicate useEffect Hides Navigation Bar Twice
- File: src/screens/da/CasesScreen.js (~L27-46)
- Problem: Two identical useEffects both call NavigationBar.setVisibilityAsync('hidden').
  Copy-paste error.
- Fix: Remove one of the duplicate useEffect blocks.


────────────────────────────────────────────────────────────────
## 🟡 MEDIUM ISSUES (11)
────────────────────────────────────────────────────────────────

### M1. Two Competing Messaging Services (Dead Code)
- Files: src/services/chatService.js, src/services/messageService.js
- Problem: chatService uses `/chat/conversations/...`, messageService uses
  `/messages/...`. All screens use messageService. chatService is dead code.
- Fix: Delete chatService.js or add a comment explaining it's unused.

### M2. Constants File Has Stale/Wrong Values
- File: src/utils/constants.js
- Problem: Hardcoded `API_BASE_URL` (never used), `USER_TYPES` uses 'farmer'/'da'
  but actual roles are 'farmers'/'DA_workers'.
- Fix: Update constants to match actual values or remove unused ones.

### M3. console.log Statements in Production Code
- Files: AuthContext.js, ChatScreen.js, CaseDetailScreen.js, UploadDiagnosisScreen.js
- Problem: Logs tokens, message data, image URIs. Not gated behind `__DEV__`.
- Fix: Wrap in `if (__DEV__)` or remove entirely.

### M4. ⚠️ Password Logged in Plaintext
- File: src/screens/auth/ResetPasswordScreen.js (~L62-67)
- Problem: `console.log("Reset password payload:", { email, otp, password, ... })`
  prints the user's new password in all environments.
- Fix: Remove this console.log immediately.

### M5. ErrorBoundary Shows Raw Stack Traces to Users
- File: src/components/ErrorBoundary.js
- Problem: Displays raw error messages and component stacks in the UI.
- Fix: Show a friendly "Something went wrong" message with a "Try Again" button.
  Only show stack traces when `__DEV__` is true.

### M6. Android Navigation Bar Hidden Globally, Never Restored
- Files: FarmerDashboard.js, DADashboard.js, CasesScreen.js
- Problem: Multiple screens hide the system nav bar but never restore it on unmount.
- Fix: Add cleanup in useEffect: `return () => NavigationBar.setVisibilityAsync('visible')`

### M7. Duplicate Authorization Header in Upload
- File: src/screens/farmer/UploadDiagnosisScreen.js (~L203-206)
- Problem: Manually sets `Authorization: Bearer ${token}` but the Axios
  interceptor already adds it. Could use a stale token from context.
- Fix: Remove the manual Authorization header. Let the interceptor handle it.

### M8. Back Button Hardcodes "Home" Instead of goBack()
- File: src/screens/farmer/ReportsScreen.js (~L418)
- Problem: `navigation.navigate("Home")` instead of `navigation.goBack()`.
- Fix: Use `navigation.goBack()`.

### M9. Messages Never Marked as Read
- File: src/screens/farmer/ChatScreen.js
- Problem: `messageService.markAsRead()` is never called. Unread counts stay
  permanently elevated.
- Fix: Call markAsRead for received messages when the chat screen is focused.

### M10. DiagnosisResult Uses Local imageUri Instead of Server URL
- File: src/screens/farmer/DiagnosisResultScreen.js (~L15-16)
- Problem: Displays the local temp file URI. If cache is cleared, image disappears.
- Fix: Prefer `result.image_url` from the server response, fallback to local URI.

### M11. 3 Quick Actions in 2-Column Grid — Asymmetric Layout
- File: src/screens/farmer/FarmerDashboard.js (~L212-234)
- Problem: 3 cards at 48% width = 1 orphan card on second row.
- Fix: Add a 4th action or use full-width for the 3rd card.


────────────────────────────────────────────────────────────────
## 🟢 LOW ISSUES (9)
────────────────────────────────────────────────────────────────

### L1. createNativeStackNavigator() Called Inside Component
- File: src/navigation/AuthNavigator.js (~L10)
- Fix: Move `const Stack = createNativeStackNavigator()` outside the component.

### L2. Unused Imports
- CasesScreen.js: `Platform` imported but redundant
- DANavigator.js: `View`, `Text`, `StyleSheet` imported but unused
- ReportsScreen.js: `SafeAreaView` imported but `useSafeAreaInsets` used instead
- Fix: Remove unused imports.

### L3. Inconsistent Role String Checks
- Multiple files use different patterns: 'farmers', 'DA_workers', 'da_worker'
- Fix: Use constants for role strings throughout.

### L4. Dead Phone Validation Regex (India-Specific)
- File: src/utils/constants.js
- Fix: Remove if not used.

### L5. No devDependencies (No Linter/Tests)
- File: package.json
- Fix: Optional — add ESLint for catching issues during development.

### L6. Dimensions.get('window') at Module Level
- File: src/screens/farmer/UploadDiagnosisScreen.js
- Status: Safe since orientation is locked to portrait. No fix needed.

### L7. Missing Keyboard Dismissal on Some Screens
- Files: DADashboard.js, UploadDiagnosisScreen.js
- Fix: Wrap in `<TouchableWithoutFeedback onPress={Keyboard.dismiss}>` or add
  `keyboardShouldPersistTaps="handled"` to ScrollViews.

### L8. Empty Google Maps API Key
- File: app.json
- Fix: Remove the empty `googleMaps` config if not used.

### L9. Dead chatService.js File
- File: src/services/chatService.js
- Fix: Delete or mark as deprecated.


════════════════════════════════════════════════════════════════
## RECOMMENDED FIX ORDER (For 1-Month Demo)
════════════════════════════════════════════════════════════════

WEEK 0 — Before Demo (MUST FIX):
  [ ] C1  — Fix conditional hooks in ChatScreen.js
  [ ] C7  — Add 401 auto-logout in api.js interceptor
  [ ] C2  — Add borderRadius.full to theme.js
  [ ] C3  — Add shadows.sm and shadows.lg to theme.js
  [ ] C4  — Add colors.lightGray to theme.js (or fix references)
  [ ] C6  — Add icon property to crop types in UploadDiagnosisScreen
  [ ] H2  — Fix fetchReports stale closure in ReportsScreen
  [ ] H3  — Remove duplicate fetchReports call in ReportsScreen
  [ ] M4  — Remove password logging in ResetPasswordScreen

WEEK 1 — First Week:
  [ ] H5  — Add chat polling (15-second interval)
  [ ] H1  — Update deprecated ImagePicker API in ChatScreen
  [ ] H6  — Replace auto-send with placeholder UI in ChatScreen
  [ ] H7  — Fix tempMsg scoping in ChatScreen
  [ ] M9  — Add markAsRead() call in ChatScreen
  [ ] M5  — Make ErrorBoundary user-friendly
  [ ] M3  — Gate console.logs behind __DEV__

WEEK 2 — Polish:
  [ ] H8  — Remove duplicate useEffect in CasesScreen
  [ ] M7  — Remove duplicate Authorization header
  [ ] M10 — Use server image URL in DiagnosisResult
  [ ] M6  — Restore Android nav bar on unmount
  [ ] L1  — Move navigator creation outside component
  [ ] L2  — Remove unused imports

OPTIONAL (If Time Permits):
  [ ] C5  — Implement api.uploadFile or remove chatService
  [ ] M1  — Delete dead chatService.js
  [ ] M2  — Fix constants.js values
  [ ] M8  — Use goBack() in ReportsScreen
  [ ] M11 — Fix dashboard grid layout
  [ ] L3-L9 — Remaining low-priority items


════════════════════════════════════════════════════════════════
## NOTES
════════════════════════════════════════════════════════════════
- Total issues found: 35 (7 critical, 8 high, 11 medium, 9 low)
- The ChatScreen.js file has the most issues (C1, H1, H5, H6, H7, M9)
  — consider a focused refactor of this one file.
- theme.js needs 4 additions (C2, C3, C4) — one quick edit fixes 3 criticals.
- The api.js 401 handling (C7) is the #1 risk for a month-long demo since
  tokens WILL expire during that period.