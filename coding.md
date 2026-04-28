# Level Code View Page with Editing Role - Implementation Guide

## 1. Overview

Create a new **Level Code View Page** at `/hr/level-codes` that displays all level codes (L01-L09) in a table. When the user clicks on a level code row, a modal opens showing all **positions at that level** along with their **assigned roles**. Users can edit the role for any position directly from this modal.

### Database Relationship
```
level_code → position → role
```

The connection between `level_code` and `role` is established **through** the `position` table:
- Each `position` has both `level_code_id` and `role_id`
- This means one level code (e.g., L01) can have **multiple positions** with **different roles**

Example data:
| Level Code | Position      | Role          |
|------------|---------------|---------------|
| L01        | CHAIRMAN      | HR            |
| L01        | CEO           | HR            |
| L02        | COO           | HR            |
| L03        | GM            | Department Head |
| L03        | TEAM LEAD     | Team Head     |
| L04        | Software Eng  | Employee      |

---

## 2. Backend Implementation

### 2.1 Entity Files (Read-Only - Already Exist)
- `backend/src/main/java/com/epms/backend/entity/LevelCode.java`
- `backend/src/main/java/com/epms/backend/entity/Position.java`
- `backend/src/main/java/com/epms/backend/entity/Role.java`

### 2.2 DTOs to Create

Create package: `backend/src/main/java/com/epms/backend/dto/levelcode/`

#### LevelCodePositionDto.java
```java
package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodePositionDto {
    private Long positionId;
    private String positionCode;
    private String positionName;
    private Long roleId;
    private String roleName;
    private String status;
}
```

#### LevelCodeDetailDto.java
```java
package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class LevelCodeDetailDto {
    private Long id;
    private String code;
    private String description;
    private List<LevelCodePositionDto> positions;
    private int positionCount;
}
```

#### LevelCodeListResponse.java
```java
package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class LevelCodeListResponse {
    private List<LevelCodeDto> data;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
```

#### LevelCodeDto.java
```java
package com.epms.backend.dto.levelcode;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LevelCodeDto {
    private Long id;
    private String code;
    private String description;
    private int positionCount;
}
```

#### CreateLevelCodeRequest.java
```java
package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLevelCodeRequest {
    @NotBlank(message = "Level code is required")
    @Size(max = 10, message = "Level code must be at most 10 characters")
    private String code;

    @Size(max = 50, message = "Description must be at most 50 characters")
    private String description;
}
```

#### UpdateLevelCodeRequest.java
```java
package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateLevelCodeRequest {
    @Size(max = 50, message = "Description must be at most 50 characters")
    private String description;
}
```

#### UpdatePositionRoleRequest.java
```java
package com.epms.backend.dto.levelcode;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePositionRoleRequest {
    @NotNull(message = "Role ID is required")
    private Long roleId;
}
```

### 2.3 Repository

Extend existing file at `backend/src/main/java/com/epms/backend/repository/LevelCodeRepository.java`

Add these methods to the existing JpaRepository interface:
```java
package com.epms.backend.repository;

import com.epms.backend.entity.LevelCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LevelCodeRepository extends JpaRepository<LevelCode, Long> {

    Optional<LevelCode> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT lc FROM LevelCode lc ORDER BY lc.code ASC")
    List<LevelCode> findAllOrderByCode();

    @Query("SELECT lc FROM LevelCode lc LEFT JOIN FETCH lc.positions WHERE lc.id = :id")
    Optional<LevelCode> findByIdWithPositions(@Param("id") Long id);
}
```

### 2.4 Service

Create at `backend/src/main/java/com/epms/backend/service/LevelCodeService.java`

```java
package com.epms.backend.service;

import com.epms.backend.dto.levelcode.*;
import com.epms.backend.entity.LevelCode;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.LevelCodeRepository;
import com.epms.backend.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LevelCodeService {

    private final LevelCodeRepository levelCodeRepository;
    private final PositionRepository positionRepository;

    @Transactional(readOnly = true)
    public LevelCodeListResponse getAllLevelCodes() {
        List<LevelCode> levelCodes = levelCodeRepository.findAllOrderByCode();
        List<LevelCodeDto> dtos = levelCodes.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return LevelCodeListResponse.builder()
                .data(dtos)
                .page(0)
                .size(dtos.size())
                .totalElements(dtos.size())
                .totalPages(1)
                .build();
    }

    @Transactional(readOnly = true)
    public LevelCodeDetailDto getLevelCodeDetail(Long id) {
        LevelCode levelCode = levelCodeRepository.findByIdWithPositions(id)
                .orElseThrow(() -> new RuntimeException("Level code not found with id: " + id));

        List<LevelCodePositionDto> positionDtos = levelCode.getPositions().stream()
                .map(this::toPositionDto)
                .collect(Collectors.toList());

        return LevelCodeDetailDto.builder()
                .id(levelCode.getId())
                .code(levelCode.getCode())
                .description(levelCode.getDescription())
                .positions(positionDtos)
                .positionCount(positionDtos.size())
                .build();
    }

    @Transactional
    public LevelCodeDto createLevelCode(CreateLevelCodeRequest request) {
        if (levelCodeRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Level code already exists: " + request.getCode());
        }

        LevelCode levelCode = new LevelCode();
        levelCode.setCode(request.getCode().toUpperCase());
        levelCode.setDescription(request.getDescription());

        LevelCode saved = levelCodeRepository.save(levelCode);
        return toDto(saved);
    }

    @Transactional
    public LevelCodeDto updateLevelCode(Long id, UpdateLevelCodeRequest request) {
        LevelCode levelCode = levelCodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Level code not found with id: " + id));

        if (request.getDescription() != null) {
            levelCode.setDescription(request.getDescription());
        }

        LevelCode saved = levelCodeRepository.save(levelCode);
        return toDto(saved);
    }

    @Transactional
    public LevelCodePositionDto updatePositionRole(Long positionId, UpdatePositionRoleRequest request) {
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new RuntimeException("Position not found with id: " + positionId));

        if (request.getRoleId() != null) {
            position.getRole().setId(request.getRoleId());
        }

        Position saved = positionRepository.save(position);
        return toPositionDto(saved);
    }

    private LevelCodeDto toDto(LevelCode lc) {
        int positionCount = lc.getPositions() != null ? lc.getPositions().size() : 0;
        return LevelCodeDto.builder()
                .id(lc.getId())
                .code(lc.getCode())
                .description(lc.getDescription())
                .positionCount(positionCount)
                .build();
    }

    private LevelCodePositionDto toPositionDto(Position p) {
        return LevelCodePositionDto.builder()
                .positionId(p.getId())
                .positionCode(p.getCode())
                .positionName(p.getName())
                .roleId(p.getRole() != null ? p.getRole().getId() : null)
                .roleName(p.getRole() != null ? p.getRole().getName() : null)
                .status(p.getStatus())
                .build();
    }
}
```

### 2.5 Controller

Create at `backend/src/main/java/com/epms/backend/controller/LevelCodeController.java`

```java
package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.levelcode.*;
import com.epms.backend.service.LevelCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/level-codes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class LevelCodeController {

    private final LevelCodeService levelCodeService;

    @GetMapping
    public ResponseEntity<ApiResponse<LevelCodeListResponse>> getAllLevelCodes() {
        return ResponseEntity.ok(ApiResponse.ok("Level codes fetched successfully.",
                levelCodeService.getAllLevelCodes()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LevelCodeDetailDto>> getLevelCodeDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Level code detail fetched successfully.",
                levelCodeService.getLevelCodeDetail(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LevelCodeDto>> createLevelCode(@Valid @RequestBody CreateLevelCodeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Level code created successfully.",
                levelCodeService.createLevelCode(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LevelCodeDto>> updateLevelCode(@PathVariable Long id,
            @Valid @RequestBody UpdateLevelCodeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Level code updated successfully.",
                levelCodeService.updateLevelCode(id, request)));
    }

    @PatchMapping("/positions/{positionId}/role")
    public ResponseEntity<ApiResponse<LevelCodePositionDto>> updatePositionRole(@PathVariable Long positionId,
            @Valid @RequestBody UpdatePositionRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Position role updated successfully.",
                levelCodeService.updatePositionRole(positionId, request)));
    }
}
```

---

## 3. Frontend Implementation

### 3.1 API Layer

Create file: `frontend/src/features/levelCode/api/levelCodeApi.ts`

```typescript
import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'

export interface LevelCodePositionDto {
  positionId: number
  positionCode: string
  positionName: string
  roleId: number | null
  roleName: string | null
  status: string
}

export interface LevelCodeDto {
  id: number
  code: string
  description: string | null
  positionCount: number
}

export interface LevelCodeDetailDto {
  id: number
  code: string
  description: string | null
  positions: LevelCodePositionDto[]
  positionCount: number
}

export interface LevelCodeListResponse {
  data: LevelCodeDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateLevelCodeRequest {
  code: string
  description?: string
}

export interface UpdateLevelCodeRequest {
  description?: string
}

export interface UpdatePositionRoleRequest {
  roleId: number
}

export const levelCodeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLevelCodes: builder.query<ApiResponse<LevelCodeListResponse>, void>({
      query: () => '/level-codes',
      providesTags: ['LevelCode'],
    }),
    getLevelCodeDetail: builder.query<ApiResponse<LevelCodeDetailDto>, number>({
      query: (id) => `/level-codes/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'LevelCode', id }],
    }),
    createLevelCode: builder.mutation<ApiResponse<LevelCodeDto>, CreateLevelCodeRequest>({
      query: (body) => ({ url: '/level-codes', method: 'POST', body }),
      invalidatesTags: ['LevelCode'],
    }),
    updateLevelCode: builder.mutation<ApiResponse<LevelCodeDto>, { id: number; body: UpdateLevelCodeRequest }>({
      query: ({ id, body }) => ({ url: `/level-codes/${id}`, method: 'PUT', body }),
      invalidatesTags: ['LevelCode'],
    }),
    updatePositionRole: builder.mutation<ApiResponse<LevelCodePositionDto>, { positionId: number; body: UpdatePositionRoleRequest }>({
      query: ({ positionId, body }) => ({ url: `/level-codes/positions/${positionId}/role`, method: 'PATCH', body }),
      invalidatesTags: ['LevelCode'],
    }),
  }),
})

export const {
  useGetLevelCodesQuery,
  useGetLevelCodeDetailQuery,
  useCreateLevelCodeMutation,
  useUpdateLevelCodeMutation,
  useUpdatePositionRoleMutation,
} = levelCodeApi
```

### 3.2 Page Component

Create file: `frontend/src/features/levelCode/pages/LevelCodeListPage.tsx`

Follow the same structure and styling patterns as `PositionListPage.tsx`. Key features:
- Display table of all level codes with columns: Level Code, Description, Position Count
- Click row to open modal showing all positions at that level
- "Create Level Code" button in header
- Edit role for each position via dropdown in modal
- Use same modal pattern (`PositionModal.tsx` as reference)
- Same pagination, filtering, and card summary styling

### 3.3 Table Component

Create file: `frontend/src/features/levelCode/components/LevelCodeTable.tsx`

Follow `PositionTable.tsx` pattern:
- TanStack Table with sortable columns
- Level code displayed with badge styling (purple theme, use `Layers` icon)
- Click row to trigger onClick with level code id
- Show position count per level code

### 3.4 Modal Components

#### LevelCodeModal.tsx
Create at `frontend/src/features/levelCode/components/LevelCodeModal.tsx`

For adding/editing level codes:
- Input field for Level Code (e.g., L10, L11)
- Input field for Description (optional)
- Validation for unique code
- Same modal styling as `PositionModal.tsx`

#### PositionRoleEditModal.tsx
Create at `frontend/src/features/levelCode/components/PositionRoleEditModal.tsx`

For editing positions' roles when a level code is clicked:
- Display level code header (e.g., "L01 - Position & Role Management")
- List all positions at that level in a sub-table or card layout
- Each position row has:
  - Position code and name (read-only display)
  - Role dropdown (editable) - use `useGetActiveRolesQuery` for options
  - Save button per row OR bulk save option
- Include position status indicator
- Handle loading/error states gracefully

### 3.5 Route Configuration

In `frontend/src/App.tsx`:
- Import `LevelCodeListPage from './features/levelCode/pages/LevelCodeListPage'`
- Add inside HR Routes section: `<Route path="level-codes" element={<LevelCodeListPage />} />`

### 3.6 Navigation Menu

In `frontend/src/layouts/HrLayout.tsx`:
- Add menu item after "Positions": `{ icon: <Layers size={20} />, label: 'Level Codes', path: '/hr/level-codes' },`
- Import `Layers` icon from lucide-react if not already imported

---

## 4. File Structure Summary

### Backend Files to Create

| File | Path |
|------|------|
| LevelCodePositionDto.java | `backend/src/main/java/com/epms/backend/dto/levelcode/LevelCodePositionDto.java` |
| LevelCodeDetailDto.java | `backend/src/main/java/com/epms/backend/dto/levelcode/LevelCodeDetailDto.java` |
| LevelCodeListResponse.java | `backend/src/main/java/com/epms/backend/dto/levelcode/LevelCodeListResponse.java` |
| LevelCodeDto.java | `backend/src/main/java/com/epms/backend/dto/levelcode/LevelCodeDto.java` |
| CreateLevelCodeRequest.java | `backend/src/main/java/com/epms/backend/dto/levelcode/CreateLevelCodeRequest.java` |
| UpdateLevelCodeRequest.java | `backend/src/main/java/com/epms/backend/dto/levelcode/UpdateLevelCodeRequest.java` |
| UpdatePositionRoleRequest.java | `backend/src/main/java/com/epms/backend/dto/levelcode/UpdatePositionRoleRequest.java` |
| LevelCodeService.java | `backend/src/main/java/com/epms/backend/service/LevelCodeService.java` |
| LevelCodeController.java | `backend/src/main/java/com/epms/backend/controller/LevelCodeController.java` |

### Backend Files to Modify

| File | Path | Changes |
|------|------|---------|
| LevelCodeRepository.java | `backend/src/main/java/com/epms/backend/repository/LevelCodeRepository.java` | Add new query methods |

### Frontend Files to Create

| File | Path |
|------|------|
| levelCodeApi.ts | `frontend/src/features/levelCode/api/levelCodeApi.ts` |
| LevelCodeListPage.tsx | `frontend/src/features/levelCode/pages/LevelCodeListPage.tsx` |
| LevelCodeTable.tsx | `frontend/src/features/levelCode/components/LevelCodeTable.tsx` |
| LevelCodeModal.tsx | `frontend/src/features/levelCode/components/LevelCodeModal.tsx` |
| PositionRoleEditModal.tsx | `frontend/src/features/levelCode/components/PositionRoleEditModal.tsx` |

### Frontend Files to Modify

| File | Path | Changes |
|------|------|---------|
| App.tsx | `frontend/src/App.tsx` | Add route for `/hr/level-codes` |
| HrLayout.tsx | `frontend/src/layouts/HrLayout.tsx` | Add "Level Codes" menu item |

---

## 5. Technical Notes

### Database Query (Reference Only - Use JPA)
The `position` table stores both `level_code_id` and `role_id`. To get positions grouped by level code via JPA:
```sql
SELECT p.*, lc.code as level_code, r.role_name as role_name
FROM position p
JOIN level_code lc ON p.level_code_id = lc.level_code_id
JOIN role r ON p.role_id = r.id
WHERE lc.level_code_id = ?
ORDER BY p.position_name
```

### Security
- All endpoints require `hasRole('HR')` authorization
- Only HR role can view, create, edit level codes and update position roles

### Error Handling
- Return appropriate HTTP status codes (200, 400, 404, 500)
- Include meaningful error messages in `ApiResponse`
- Handle duplicate level code creation gracefully

### UI/UX Considerations
- Use consistent styling with existing pages (PositionListPage reference)
- Purple/indigo color theme for level code badges
- Loading spinners during data fetch
- Toast notifications for success/error
- Modal should be centered, scrollable for long position lists
- Use same card-based statistics display as PositionListPage

### Implementation Order
1. Create DTOs (backend)
2. Extend Repository (backend)
3. Create Service (backend)
4. Create Controller (backend)
5. Create API layer (frontend)
6. Create Table component (frontend)
7. Create Modal components (frontend)
8. Create Page component (frontend)
9. Add Route in App.tsx (frontend)
10. Add Navigation menu in HrLayout.tsx (frontend)
