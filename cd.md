# Task: Implement Multiple Signature Support with Labels

## Goal

Allow users to have multiple saved signatures and choose which one to set as their default, rather than only having one signature that is always the default.

## Context

The system currently has a single-signature model:
- Users can draw or upload ONE signature
- That signature is automatically set as the default
- There is no concept of multiple signatures to choose from

## Desired Behavior

1. Users can create and save multiple signatures (with optional names/labels)
2. Users can view all their saved signatures in a list/grid
3. Users can set any saved signature as the default via a "Set as Default" button
4. Users can delete a signature (but not the last one)
5. The "Create New Signature" section saves without auto-setting as default - user must manually click "Set as Default"

## Implementation Plan

### Backend Changes

#### 1. Modify `Signature.java` (Entity)
- Add `name` field: `private String name;`
- Add getter/setter
- Column: `@Column(length = 50) private String name;`

#### 2. Modify `SignatureDto.java`
- Add `name` field to the record: `String name`
- Update `from()` method to include: `signature.getName()`

#### 3. Modify `SignatureRepository.java`
- Add: `long countByUser(User user)` method

#### 4. Modify `SignatureService.java`
- Rename `saveNewDefaultSignature` to `saveSignature` and remove auto-default logic
- Add `setDefaultSignature(User user, Long signatureId)`:
  - Find signature by ID (must belong to user)
  - Clear existing default: `signatureRepository.clearDefaultForUser(user)`
  - Set this signature as default
  - Save and return
- Add `deleteSignature(User user, Long signatureId)`:
  - Check signature count > 1, reject if last
  - Find signature by ID (must belong to user)
  - Delete storage file
  - Delete entity
- `saveDrawnSignature` / `saveUploadedSignature`:
  - Call `saveSignature` instead of `saveNewDefaultSignature`
  - No longer clear existing defaults or set new signature as default

#### 5. Modify `SignatureController.java`
- Keep existing endpoints but update behavior:
  - `POST /api/signatures/drawn` - saves new signature (NOT as default)
  - `POST /api/signatures/upload` - saves new signature (NOT as default)
- Add new endpoints:
  - `PATCH /api/signatures/{id}/default` - set signature as default
    - Returns 404 if signature not found or doesn't belong to user
    - Returns 400 if it's already the default
  - `DELETE /api/signatures/{id}` - delete signature
    - Returns 400 if it's the last signature
    - Returns 404 if not found or doesn't belong to user

### Frontend Changes

#### 6. Modify `userApi.ts`
- Add `SignatureDto.name?: string` field (backend sends it)
- Add endpoints:
  ```typescript
  getAllSignatures: builder.query<ApiResponse<SignatureDto[]>, void>({
    query: () => '/signatures',
    providesTags: ['Signature'],
  }),
  setDefaultSignature: builder.mutation<ApiResponse<SignatureDto>, number>({
    query: (signatureId) => ({
      url: `/signatures/${signatureId}/default`,
      method: 'PATCH',
    }),
    invalidatesTags: ['Signature'],
  }),
  deleteSignature: builder.mutation<ApiResponse<null>, number>({
    query: (signatureId) => ({
      url: `/signatures/${signatureId}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['Signature'],
  }),
  ```
- Export new hooks: `useGetAllSignaturesQuery`, `useSetDefaultSignatureMutation`, `useDeleteSignatureMutation`

#### 7. Modify `DefaultSignaturePage.tsx`

**New UI Structure:**

```
┌──────────────────────────────────────────────────────────┐
│  Signature Settings                                       │
│  Create and manage your default signature...             │
├──────────────────────────────────────────────────────────┤
│  ┌─ My Signatures ─────────────────────────────────────┐ │
│  │                                                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │ │
│  │  │ preview │  │ preview │  │ preview │  ...         │ │
│  │  │ "Name"  │  │ "Name"  │  │ "Name"  │             │ │
│  │  │[Default]│  │[Set Def]│  │[Set Def]│             │ │
│  │  │[Delete] │  │[Delete] │  │[Delete] │             │ │
│  │  └─────────┘  └─────────┘  └─────────┘             │ │
│  │                                                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─ Create New Signature ───────────────────────────────┐ │
│  │  [Draw] [Upload] tabs                                 │ │
│  │                                                         │ │
│  │  (existing canvas or upload UI)                       │ │
│  │                                                         │ │
│  │  Signature name (optional)                            │ │
│  │  [________________________________]  max 50 chars      │ │
│  │                                                         │ │
│  │  [Save Signature]                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  (Tips section unchanged)                                 │
└──────────────────────────────────────────────────────────┘
```

**Key UI Elements:**

1. **My Signatures Section** (new top section):
   - Fetch all signatures via `useGetAllSignaturesQuery`
   - Display as grid of cards (responsive: 1-3 columns)
   - Each card shows:
     - Signature preview image
     - Name label (or "Untitled" if no name)
     - "Default" badge (if isDefault) OR "Set as Default" button
     - "Delete" button (disabled if only 1 signature exists)
   - Empty state if no signatures exist

2. **Create New Signature Section** (modify existing):
   - Keep existing draw/upload tabs and canvas
   - Add signature name input field above "Save Signature" button
   - Change button text from "Save as Default" to "Save Signature"
   - After save, show success toast and clear form

3. **Existing "Current Signature" section** - Remove or integrate into the new grid

**State Management:**
- `signatureNameInput` state for the name field
- Modal confirmation before deleting signature
- Loading states for all async operations

### Database

- Add nullable `name` VARCHAR(50) column to `signatures` table
- If using JPA/Hibernate with `spring.jpa.hibernate.ddl-auto=update` or similar, the entity change will handle this automatically

## File Paths

| Component | Path |
|-----------|------|
| Backend Entity | `backend/src/main/java/com/epms/backend/entity/Signature.java` |
| Backend DTO | `backend/src/main/java/com/epms/backend/dto/SignatureDto.java` |
| Backend Repository | `backend/src/main/java/com/epms/backend/repository/SignatureRepository.java` |
| Backend Service | `backend/src/main/java/com/epms/backend/service/SignatureService.java` |
| Backend Controller | `backend/src/main/java/com/epms/backend/controller/SignatureController.java` |
| Frontend API | `frontend/src/features/user/userApi.ts` |
| Frontend Page | `frontend/src/pages/DefaultSignaturePage.tsx` |

## Success Criteria

1. User can view all their saved signatures in a grid
2. User can create a new signature without it automatically becoming default
3. User can click "Set as Default" on any signature to make it the default
4. User can delete a signature (except the last one)
5. User can optionally name their signatures
6. All existing functionality (draw/upload) continues to work
7. No breaking changes to existing API consumers

## Notes

- Use Lucide icons already imported in DefaultSignaturePage.tsx
- Follow existing code style and conventions
- Toast messages for user feedback (success/error)
- Handle edge cases: network errors, concurrent modifications, etc.