---

## Coding Agent Prompt: Notification System with WebSocket + STOMP

### Project Overview
Add a real-time notification system to an employee performance management system. When feedback is submitted, the chosen employee receives a notification. Use WebSocket + STOMP for real-time push, with DB persistence for notification history.

### Tech Stack
- **Backend**: Java 17, Spring Boot 4.0.4, Spring Data JPA, MySQL, Spring Security (JWT)
- **Frontend**: React 19, TypeScript, Redux Toolkit, React Router 7, Material UI
- **Real-time**: WebSocket + STOMP (STOMP over WebSocket)

### Requirements Summary

1. **Database**: `notifications` table already exists with `id`, `user_id`, `title`, `message`, `is_read`, `created_at`

2. **Anonymous Handling**:
   - **Reveal name (Direct Manager)**: If `evaluator_id` equals evaluatee's `manager_id` in employee table → show actual name
   - **Hide name (Anonymous)**: If PEER or SUBORDINATE role → show "Anonymous" only

3. **Notification Content**: Message should be exactly "You have received feedback"

4. **WebSocket + STOMP**:
   - Push real-time notifications to connected clients
   - Endpoint: `/ws` for WebSocket connection
   - Subscribe destination per user: `/user/queue/notifications`

5. **Notification Bell UI**:
   - Place in `EmployeeLayout`, `HrLayout`, `ManagerLayout` headers
   - Badge showing unread count (display "99+" if count exceeds 99)
   - Bell icon with MUI Badge
   - Clicking notification: mark as read + navigate to "Get Feedback page"
   - Real-time update without page refresh

6. **On Feedback Submit** (`POST /api/feedback`):
   - After feedback saved, create notification for evaluatee
   - Send via WebSocket to the evaluatee's subscribed queue
   - Store in DB

### Implementation Tasks

#### Backend:
1. **Add WebSocket/STOMP configuration**
   - Create `WebSocketConfig.java` with `@EnableWebSocketMessageBroker`
   - Configure SimpleBroker with `/queue` prefix
   - Set user destination prefix `/user/queue`
   - Endpoint: `/ws`

2. **Modify `Notification.java` entity** (if needed)
   - Ensure it has proper JPA mappings for WebSocket serialisation

3. **Create `NotificationController.java`**
   - `GET /api/notifications` - Get user's notifications (paginated)
   - `GET /api/notifications/unread-count` - Get unread count
   - `PUT /api/notifications/{id}/read` - Mark single as read
   - `PUT /api/notifications/read-all` - Mark all as read

4. **Create `WebSocketNotificationService.java`**
   - `sendNotification(Long userId, Notification notification)` - Push via STOMP to `/user/queue/notifications`

5. **Modify `FeedbackService.java`**
   - In submit feedback method: after saving, call `NotificationService.send()` and `WebSocketNotificationService.sendNotification()`

6. **Add notification-related repository methods** if not already present

#### Frontend:
1. **Create WebSocket service** (`services/websocketService.ts`)
   - Connect to `/ws` with STOMP protocol
   - Subscribe to `/user/queue/notifications`
   - Handle incoming notifications (update Redux state)
   - Auto-reconnect on disconnect
   - Disconnect on logout

2. **Add notification API endpoints** to `baseApi`
   - `GET /api/notifications`
   - `GET /api/notifications/unread-count`
   - `PUT /api/notifications/{id}/read`
   - `PUT /api/notifications/read-all`

3. **Create `notificationSlice.ts`** in Redux
   - State: `notifications[]`, `unreadCount`, `wsConnected`
   - Reducers: `addNotification`, `setNotifications`, `setUnreadCount`, `markAsRead`, `markAllAsRead`

4. **Create `NotificationBell.tsx` component**
   - MUI Badge with IconButton (Bell icon)
   - Popover/Popper showing notification list
   - Click item → mark read + navigate to `/employee/get-feedback`
   - Limit display to most recent notifications if needed

5. **Add NotificationBell to layouts**:
   - `HrLayout.tsx`
   - `ManagerLayout.tsx`
   - `EmployeeLayout.tsx`

6. **Integrate WebSocket connection lifecycle**:
   - Connect on login/auth success
   - Disconnect on logout
   - Reconnect on token refresh

### Key Files to Modify

| Area | File |
|------|------|
| Backend | `backend/src/main/java/com/epms/backend/config/WebSocketConfig.java` (new) |
| Backend | `backend/src/main/java/com/epms/backend/service/WebSocketNotificationService.java` (new) |
| Backend | `backend/src/main/java/com/epms/backend/service/NotificationService.java` (modify - add ws push) |
| Backend | `backend/src/main/java/com/epms/backend/service/FeedbackService.java` (modify - send notification) |
| Backend | `backend/src/main/java/com/epms/backend/controller/NotificationController.java` (new) |
| Frontend | `frontend/src/services/websocketService.ts` (new) |
| Frontend | `frontend/src/features/notification/notificationApi.ts` (new) |
| Frontend | `frontend/src/features/notification/notificationSlice.ts` (new) |
| Frontend | `frontend/src/components/common/NotificationBell.tsx` (new) |
| Frontend | `frontend/src/layouts/HrLayout.tsx` (modify) |
| Frontend | `frontend/src/layouts/ManagerLayout.tsx` (modify) |
| Frontend | `frontend/src/layouts/EmployeeLayout.tsx` (modify) |

### Verification Steps
1. Run backend and frontend
2. Login as Employee A
3. As different user, give feedback to Employee A (as Peer/Subordinate → should say "Anonymous"; as Manager who is also direct manager → should reveal name)
4. Employee A should see real-time notification appear (without refresh)
5. Click notification → navigates to Get Feedback page
6. Logout/login → notifications persist in DB and reload
7. Test HR and Manager layouts have notification bell
8. Test unread count badge displays correctly (99+ limit)

---