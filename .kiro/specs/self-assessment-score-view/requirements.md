# Requirements Document

## Introduction

The Self-Assessment Score View feature introduces a dedicated page that displays self-assessment forms which have been submitted at least once, allowing HR users and Department Head users to review employee scores, performance ratings, and form statuses across a single, filterable table. The page is scoped by role: HR users see forms across all departments, while Department Head users see only forms belonging to employees in departments they manage. The feature covers two new backend endpoints (one per role), a role-aware frontend page with TanStack Table client-side pagination, role-specific columns, filters, summary cards, and a per-row navigation action that routes to the existing review screens for each role.

## Glossary

- **Self_Assessment_Score_View_System**: The end-to-end feature comprising the backend endpoints, the service layer logic, and the frontend page that lists self-assessment forms with scores.
- **Score_View_Backend**: The backend component exposing `GET /api/self-assessment-forms/hr/scores` and `GET /api/self-assessment-forms/manager/scores` in `SelfAssessmentFormController.java`, backed by `SelfAssessmentFormService`.
- **Score_View_Frontend**: The frontend page under `frontend/src/pages/self-assessment-form/` (e.g. `SelfAssessmentScorePage.tsx`) and its associated RTK Query endpoints injected into `frontend/src/features/selfAssessmentForm/api/selfAssessmentFormApi.ts`.
- **HR_User**: An authenticated user whose `principal.roleId` equals `1`.
- **Dept_Head_User**: An authenticated user whose `principal.roleId` equals `2` and who is recorded as the manager of one or more departments via `DepartmentManagerHistory` or `Department.managerId`.
- **Submitted_At_Least_Once**: A self-assessment form whose status is one of `SUBMITTED`, `MANAGER_REVIEWED`, `APPROVED`, `REOPENED`, `PENDING_MANAGER_REVIEW`, `PENDING_EMPLOYEE_REVIEW`, `PENDING_FINAL_APPROVAL`, `PENDING_HR_CALIBRATION_REVIEW`, or `FINALIZED_LOCKED`.
- **Excluded_Status**: A self-assessment form status of `DRAFT`, `NOT_STARTED`, or `NOT_SUBMITTED`.
- **Displayed_Score**: The numeric score shown in the Score column, resolved as `finalApprovedTotalScore` when present, otherwise `managerRevisedTotalScore`, otherwise `totalScore`.
- **Displayed_Performance**: The text value taken from the form's existing `ratingCategory` field.
- **Period**: The review cycle (`cycleName`) associated with the self-assessment form.
- **HR_View_Route**: The frontend route `/hr/self-assessment/reviews/:formId`.
- **Dept_Head_View_Route**: The frontend route `/manager/self-assessment-forms/reviews/:formId`.
- **HR_Scores_Route**: The frontend route `/hr/self-assessment/scores`.
- **Dept_Head_Scores_Route**: The frontend route `/manager/self-assessment-forms/scores`.
- **ApiResponse_Wrapper**: The existing `ApiResponse<T>` response envelope used by the backend.
- **SelfAssessmentScoreListDto**: A DTO record containing `finalApprovedTotalScore`, `managerRevisedTotalScore`, `totalScore`, `ratingCategory`, `cycleName`, employee info (name, department, position), and status, to be reused from `FormListDto` if it already fits or introduced as a new record otherwise.

## Requirements

### Requirement 1: HR Score List Endpoint

**User Story:** As an HR user, I want an endpoint that returns every self-assessment form submitted at least once across all departments, so that the Score View page can display organization-wide scores.

#### Acceptance Criteria

1. THE Score_View_Backend SHALL expose an HTTP GET endpoint at `/api/self-assessment-forms/hr/scores`.
2. THE Score_View_Backend SHALL annotate the HR scores endpoint with `@PreAuthorize("principal.roleId == 1")`.
3. WHEN an HR_User calls `GET /api/self-assessment-forms/hr/scores`, THE Score_View_Backend SHALL return every self-assessment form whose status is Submitted_At_Least_Once, regardless of department.
4. WHEN the HR scores endpoint returns results, THE Score_View_Backend SHALL exclude every self-assessment form whose status is an Excluded_Status.
5. WHEN the HR scores endpoint returns results, THE Score_View_Backend SHALL wrap the payload in the ApiResponse_Wrapper.
6. WHEN the HR scores endpoint returns a form, THE Score_View_Backend SHALL include `finalApprovedTotalScore`, `managerRevisedTotalScore`, `totalScore`, `ratingCategory`, `cycleName`, employee name, department name, position, and status in the SelfAssessmentScoreListDto.
7. IF a caller without `principal.roleId == 1` invokes `GET /api/self-assessment-forms/hr/scores`, THEN THE Score_View_Backend SHALL deny the request via the Spring Security authorization mechanism.

### Requirement 2: Department Head Score List Endpoint

**User Story:** As a Department Head user, I want an endpoint that returns self-assessment forms submitted at least once for employees in the departments I manage, so that the Score View page only shows forms within my scope.

#### Acceptance Criteria

1. THE Score_View_Backend SHALL expose an HTTP GET endpoint at `/api/self-assessment-forms/manager/scores`.
2. THE Score_View_Backend SHALL annotate the manager scores endpoint with `@PreAuthorize("principal.roleId == 2")`.
3. WHEN a Dept_Head_User calls `GET /api/self-assessment-forms/manager/scores`, THE Score_View_Backend SHALL return only self-assessment forms whose employee belongs to a department currently managed by the calling Dept_Head_User, as determined via `DepartmentManagerHistory` or `Department.managerId`.
4. WHEN the manager scores endpoint returns results, THE Score_View_Backend SHALL include only forms whose status is Submitted_At_Least_Once and SHALL exclude every form whose status is an Excluded_Status.
5. WHEN the manager scores endpoint returns results, THE Score_View_Backend SHALL wrap the payload in the ApiResponse_Wrapper.
6. WHEN the manager scores endpoint returns a form, THE Score_View_Backend SHALL include `finalApprovedTotalScore`, `managerRevisedTotalScore`, `totalScore`, `ratingCategory`, `cycleName`, employee name, position, and status in the SelfAssessmentScoreListDto.
7. IF a caller without `principal.roleId == 2` invokes `GET /api/self-assessment-forms/manager/scores`, THEN THE Score_View_Backend SHALL deny the request via the Spring Security authorization mechanism.
8. IF a Dept_Head_User manages no departments at the time of the call, THEN THE Score_View_Backend SHALL return an empty list wrapped in the ApiResponse_Wrapper.

### Requirement 3: Displayed Score Resolution

**User Story:** As a user of the Score View page, I want the Score column to reflect the most authoritative score available, so that I always see the current agreed-upon score for each form.

#### Acceptance Criteria

1. WHEN the Score_View_Frontend renders the Score column for a form whose `finalApprovedTotalScore` is present, THE Score_View_Frontend SHALL display `finalApprovedTotalScore` as the Displayed_Score.
2. WHEN the Score_View_Frontend renders the Score column for a form whose `finalApprovedTotalScore` is absent and whose `managerRevisedTotalScore` is present, THE Score_View_Frontend SHALL display `managerRevisedTotalScore` as the Displayed_Score.
3. WHEN the Score_View_Frontend renders the Score column for a form whose `finalApprovedTotalScore` and `managerRevisedTotalScore` are both absent, THE Score_View_Frontend SHALL display `totalScore` as the Displayed_Score.
4. THE Score_View_Frontend SHALL render the Displayed_Score alongside a progress bar in the Score column.
5. THE Score_View_Frontend SHALL display the form's `ratingCategory` value as the Displayed_Performance in the Performance column.

### Requirement 4: HR Score View Page Columns and Summary Cards

**User Story:** As an HR user, I want the Score View page to show organization-wide columns without aggregate summary cards, so that I can browse all forms in a consistent tabular layout.

#### Acceptance Criteria

1. WHEN an HR_User opens the HR_Scores_Route, THE Score_View_Frontend SHALL render a table with the columns Employee Name, Department, Position, Period, Score, Performance, Status, and Actions, in that order.
2. WHEN an HR_User opens the HR_Scores_Route, THE Score_View_Frontend SHALL omit the Average Score, Top Score, and Total Form Count summary cards.
3. WHEN an HR_User opens the HR_Scores_Route, THE Score_View_Frontend SHALL request data from `GET /api/self-assessment-forms/hr/scores`.
4. WHEN an HR_User clicks the View action on a row, THE Score_View_Frontend SHALL navigate to `/hr/self-assessment/reviews/:formId` using the form's identifier.

### Requirement 5: Department Head Score View Page Columns and Summary Cards

**User Story:** As a Department Head user, I want role-specific columns plus aggregate summary cards, so that I can see high-level metrics for forms in my departments alongside the detailed table.

#### Acceptance Criteria

1. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL render a table with the columns Employee Name, Position, Period, Score, Performance, Status, and Actions, in that order.
2. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL display three summary cards labeled Average Score, Top Score, and Total Form Count.
3. WHEN the Score_View_Frontend computes the Average Score summary card, THE Score_View_Frontend SHALL calculate the arithmetic mean of the Displayed_Score across all forms currently returned by the manager scores endpoint.
4. WHEN the Score_View_Frontend computes the Top Score summary card, THE Score_View_Frontend SHALL calculate the maximum Displayed_Score across all forms currently returned by the manager scores endpoint.
5. WHEN the Score_View_Frontend computes the Total Form Count summary card, THE Score_View_Frontend SHALL display the count of forms currently returned by the manager scores endpoint.
6. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL request data from `GET /api/self-assessment-forms/manager/scores`.
7. WHEN a Dept_Head_User clicks the View action on a row, THE Score_View_Frontend SHALL navigate to `/manager/self-assessment-forms/reviews/:formId` using the form's identifier.
8. IF the manager scores endpoint returns zero forms, THEN THE Score_View_Frontend SHALL display `0` in the Total Form Count card and a neutral placeholder (for example, a dash) in the Average Score and Top Score cards.

### Requirement 6: HR Filters and Search

**User Story:** As an HR user, I want filters and a name search, so that I can narrow the Score View to a specific department, position, cycle, status, or score range and quickly find a named employee.

#### Acceptance Criteria

1. WHEN an HR_User opens the HR_Scores_Route, THE Score_View_Frontend SHALL render filter controls for Department, Position, Review Cycle, Status, and Score range.
2. WHEN an HR_User opens the HR_Scores_Route, THE Score_View_Frontend SHALL render an Employee Name search input separate from the filter controls.
3. WHEN an HR_User changes any filter value, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose corresponding field matches every active filter value.
4. WHEN an HR_User types a value into the Employee Name search input, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose employee name contains the typed value using a case-insensitive match.
5. WHERE an HR_User has not selected any value for a given filter, THE Score_View_Frontend SHALL treat that filter as inactive and SHALL NOT use the filter to restrict rows.
6. WHEN an HR_User sets a Score range filter with a minimum and a maximum, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose Displayed_Score is greater than or equal to the minimum and less than or equal to the maximum.

### Requirement 7: Department Head Filters and Search

**User Story:** As a Department Head user, I want filters and a name search scoped to my managed departments, so that I can focus on a specific position, cycle, status, or score range and quickly find a named employee.

#### Acceptance Criteria

1. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL render filter controls for Position, Review Cycle, Status, and Score range.
2. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL omit the Department filter control.
3. WHEN a Dept_Head_User opens the Dept_Head_Scores_Route, THE Score_View_Frontend SHALL render an Employee Name search input separate from the filter controls.
4. WHEN a Dept_Head_User changes any filter value, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose corresponding field matches every active filter value.
5. WHEN a Dept_Head_User types a value into the Employee Name search input, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose employee name contains the typed value using a case-insensitive match.
6. WHERE a Dept_Head_User has not selected any value for a given filter, THE Score_View_Frontend SHALL treat that filter as inactive and SHALL NOT use the filter to restrict rows.
7. WHEN a Dept_Head_User sets a Score range filter with a minimum and a maximum, THE Score_View_Frontend SHALL restrict the displayed table rows to forms whose Displayed_Score is greater than or equal to the minimum and less than or equal to the maximum.

### Requirement 8: Client-Side Pagination

**User Story:** As a user of the Score View page, I want client-side pagination with a page size selector and navigation controls, so that I can browse large result sets comfortably.

#### Acceptance Criteria

1. THE Score_View_Frontend SHALL render the score table using TanStack Table v8 with client-side pagination.
2. THE Score_View_Frontend SHALL render a page size selector that allows the user to change the number of rows per page.
3. THE Score_View_Frontend SHALL render previous, next, and numbered page controls for navigating pages.
4. WHEN a user changes the page size, THE Score_View_Frontend SHALL re-render the table with the newly selected number of rows per page and SHALL return to the first page.
5. WHEN a user clicks the next page control while more pages exist, THE Score_View_Frontend SHALL display the next page of rows.
6. WHEN a user clicks the previous page control while on any page after the first, THE Score_View_Frontend SHALL display the previous page of rows.
7. WHEN a user clicks a specific page number control, THE Score_View_Frontend SHALL display the rows for that page.
8. WHEN active filters or the Employee Name search change the row set, THE Score_View_Frontend SHALL recompute pagination against the filtered rows and SHALL return to the first page.

### Requirement 9: Routing and Page Structure

**User Story:** As a developer, I want the Score View page registered under role-appropriate routes and built as regular function components, so that the page follows the established routing and component conventions of the codebase.

#### Acceptance Criteria

1. THE Score_View_Frontend SHALL register the HR_Scores_Route at `/hr/self-assessment/scores` within the HR section of `frontend/src/App.tsx`.
2. THE Score_View_Frontend SHALL register the Dept_Head_Scores_Route at `/manager/self-assessment-forms/scores` within the Manager section of `frontend/src/App.tsx`.
3. THE Score_View_Frontend SHALL implement the Score View page under `frontend/src/pages/self-assessment-form/` as either a single role-branching page or two role-specific pages.
4. THE Score_View_Frontend SHALL implement every page and component introduced by this feature as a regular function component with typed props.
5. THE Score_View_Frontend SHALL NOT use `React.FC` as the type for any component introduced by this feature.
6. THE Score_View_Frontend SHALL inject the HR scores endpoint and the manager scores endpoint into `frontend/src/features/selfAssessmentForm/api/selfAssessmentFormApi.ts` using `baseApi.injectEndpoints`.
7. THE Score_View_Frontend SHALL style the Score View page using TailwindCSS classes consistent with the existing `SelfAssessmentActiveFormsPage.tsx`.

### Requirement 10: Status Scope Enforcement

**User Story:** As a product owner, I want the Score View to consistently exclude non-submitted forms, so that only forms that have been submitted at least once appear in either role view.

#### Acceptance Criteria

1. IF a self-assessment form has a status of `DRAFT`, `NOT_STARTED`, or `NOT_SUBMITTED`, THEN THE Score_View_Backend SHALL exclude the form from both the HR scores endpoint response and the manager scores endpoint response.
2. WHEN the Score_View_Backend evaluates which forms are Submitted_At_Least_Once, THE Score_View_Backend SHALL include forms whose status is any of `SUBMITTED`, `MANAGER_REVIEWED`, `APPROVED`, `REOPENED`, `PENDING_MANAGER_REVIEW`, `PENDING_EMPLOYEE_REVIEW`, `PENDING_FINAL_APPROVAL`, `PENDING_HR_CALIBRATION_REVIEW`, or `FINALIZED_LOCKED`.
3. WHEN the Score_View_Frontend renders the Status column, THE Score_View_Frontend SHALL display the status value exactly as returned by the Score_View_Backend.
