# Notification Feature Enhancement

## Objective
Enhance the notification system to:
1. Store and display the notification source (e.g., "360 Feedback") as the title when notifications come from 360 Feedback
2. Add tab filtering (All, Unread, Read) to the notification dropdown

---

## Context

### Current Database Schema
```sql
notifications table:
- id: bigint (PK, AUTO_INCREMENT)
- created_at: datetime(6)
- message: text (NOT NULL) - e.g., "You have received feedback"
- is_read: bit(1)
- title: varchar(255) (NOT NULL) - currently set differently per source
- user_id: bigint (FK to user_account)
```

### Current Notification Flow
1. Backend services (FeedbackService, SelfAssessmentService, PipService) create notifications via `NotificationService.send()`
2. Notifications are saved to MySQL database and sent via WebSocket + Stomp
3. Frontend `NotificationBell` component displays notifications in a dropdown popover
4. Real-time updates via WebSocket already working

---

## Implementation Tasks

### Phase 1: Database Migration

**File**: `backend/src/main/resources/schema.sql` or create migration script

Add `source` column to `notifications` table:
```sql
ALTER TABLE notifications ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'GENERAL';
```

---

### Phase 2: Backend Changes

#### 2.1 Update Notification Entity
**File**: `backend/src/main/java/com/epms/backend/entity/Notification.java`

- Add `private String source;` field
- Add `@Column(nullable = false)` annotation
- Generate getter/setter or use Lombok if project uses it

#### 2.2 Update NotificationDto
**File**: `backend/src/main/java/com/epms/backend/dto/NotificationDto.java`

- Add `String source;` field to the record definition

#### 2.3 Update NotificationService
**File**: `backend/src/main/java/com/epms/backend/service/NotificationService.java`

**In `send()` method**:
- Add `String source` parameter
- Set `notification.setSource(source)` before saving

**Update method signature** (if needed):
```java
public void send(User recipient, String title, String message, String source)
```

#### 2.4 Update Notification Triggers

Update these services to pass `source` when calling `notificationService.send()`:

**File**: `backend/src/main/java/com/epms/backend/service/FeedbackService.java`
- When sending notification: pass `source = "360_FEEDBACK"`

**File**: `backend/src/main/java/com/epms/backend/service/SelfAssessmentService.java`
- When sending notification: pass appropriate source (e.g., `"SELF_ASSESSMENT"`)

**File**: `backend/src/main/java/com/epms/backend/service/PipService.java`
- When sending notification: pass appropriate source (e.g., `"PIP"`)

---

### Phase 3: Frontend Changes

#### 3.1 Update Notification Types
**File**: `frontend/src/features/notification/notificationSlice.ts`

Update `NotificationItem` interface:
```typescript
export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  source: string;  // ADD THIS FIELD
}
```

#### 3.2 Update NotificationBell Component
**File**: `frontend/src/components/common/NotificationBell.tsx`

**Add state for selected tab**:
```typescript
const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'read'>(() => {
  return (localStorage.getItem('notifTab') as 'all' | 'unread' | 'read') || 'all';
});
```

**Persist tab selection to localStorage** when changed.

**Add tab bar UI inside the Popover**, before the notification list:
```tsx
<div className="flex border-b border-gray-200">
  <button
    className={`flex-1 py-2 text-sm font-medium ${selectedTab === 'all' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}
    onClick={() => setSelectedTab('all')}
  >
    All
  </button>
  <button
    className={`flex-1 py-2 text-sm font-medium ${selectedTab === 'unread' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}
    onClick={() => setSelectedTab('unread')}
  >
    Unread
  </button>
  <button
    className={`flex-1 py-2 text-sm font-medium ${selectedTab === 'read' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}
    onClick={() => setSelectedTab('read')}
  >
    Read
  </button>
</div>
```

**Filter notifications based on selected tab**:
```typescript
const filteredNotifications = notifications.filter(n => {
  if (selectedTab === 'unread') return !n.read;
  if (selectedTab === 'read') return n.read;
  return true; // 'all'
});
```

**Conditionally show "Mark all read" button**:
- Show "Mark all read" button only when `selectedTab === 'unread'`

---

## Design Specifications

### Tab Styling
- Use teal (`text-teal-600`) for active tab with `border-b-2 border-teal-600`
- Use gray (`text-gray-500`) for inactive tabs
- Flex layout with equal width (`flex-1`) for each tab
- Border bottom separator between tabs and notification list

### Title Display Logic
When displaying notification title:
- If `source === '360_FEEDBACK'`, display title as `"360 Feedback"`
- Otherwise, display the stored `title` field as-is

### Notification Item Styling
- Unread notifications: highlighted background (`rgb(240 253 250)`) with teal dot indicator
- Read notifications: plain white background, no dot
- Show message text and formatted timestamp (e.g., "2 hours ago")

---

## Files Summary

### Backend (Read/Modify)
| File | Action |
|------|--------|
| `backend/src/main/resources/schema.sql` | Add source column migration |
| `backend/src/main/java/com/epms/backend/entity/Notification.java` | Add source field |
| `backend/src/main/java/com/epms/backend/dto/NotificationDto.java` | Add source field |
| `backend/src/main/java/com/epms/backend/service/NotificationService.java` | Update send() method |
| `backend/src/main/java/com/epms/backend/service/FeedbackService.java` | Pass source="360_FEEDBACK" |
| `backend/src/main/java/com/epms/backend/service/SelfAssessmentService.java` | Pass appropriate source |
| `backend/src/main/java/com/epms/backend/service/PipService.java` | Pass appropriate source |

### Frontend (Read/Modify)
| File | Action |
|------|--------|
| `frontend/src/features/notification/notificationSlice.ts` | Add source to type |
| `frontend/src/components/common/NotificationBell.tsx` | Add tabs UI and filtering |

---

## Verification Steps

1. **Database**: Verify `source` column exists in `notifications` table
2. **Backend**: Create a test notification with source and verify it's saved correctly
3. **Frontend**: Open notification dropdown and verify:
   - Tab bar appears with All/Unread/Read tabs
   - Clicking tabs filters notifications correctly
   - Selected tab persists after closing/reopening dropdown
   - "Mark all read" only appears on Unread tab
4. **Real-time**: Verify new notifications appear in correct tab based on read status
