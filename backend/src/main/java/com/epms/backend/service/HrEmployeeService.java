package com.epms.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.epms.backend.StaffTypes;
import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.hr.EmployeeDetailResponseDto;
import com.epms.backend.dto.hr.EmployeeViewResponseDto;
import com.epms.backend.dto.hr.EmployeeListItemResponseDto;
import com.epms.backend.dto.hr.EmployeeListResponseDto;
import com.epms.backend.dto.hr.EmployeeUpdateRequestDto;
import com.epms.backend.dto.hr.EmploymentStatusHistoryResponseDto;
import com.epms.backend.dto.hr.PasswordActionResponseDto;
import com.epms.backend.dto.hr.UpdateEmploymentStatusRequestDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmergencyContact;
import com.epms.backend.entity.EmployeeFather;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.EmployeeSpouse;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.EmploymentStatusHistory;
import com.epms.backend.entity.MaritalStatus;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.EmploymentStatusHistoryRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.util.PersonNameNormalizer;
import com.epms.backend.validation.ProfilePictureUrlValidator;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HrEmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeDepartmentHistoryRepository employeeDepartmentHistoryRepository;
    private final UserRepository userRepository;
    private final StaffTypeRepository staffTypeRepository;
    private final DepartmentPositionRepository departmentPositionRepository;
    private final EmploymentStatusHistoryRepository employmentStatusHistoryRepository;
    private final PositionRoleResolutionService positionRoleResolutionService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AuditService auditService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 8;
    private static final long ROLE_HR = 1L;
    private static final long ROLE_DEPARTMENT_MANAGER = 2L;

    @Transactional(readOnly = true)
    public EmployeeListResponseDto getEmployeesForCurrentUser(int page, int size, String search, Long departmentId, Long positionId, String employmentStatus, String sortBy, String sortDir, UserPrincipal principal) {
        validateCanAccessEmployeeList(principal);
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = resolveEmployeeSort(sortBy, direction);
        Pageable pageable = PageRequest.of(page, size, sort);
        Long managerDepartmentId = isDepartmentManager(principal)
                ? resolveCurrentDepartmentId(principal)
                : null;

        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String[] keywords = search.toLowerCase().split("\\s+");
                for (String keyword : keywords) {
                    if (keyword.isEmpty()) continue;
                    String pattern = "%" + keyword + "%";
                    predicates.add(cb.or(
                        cb.like(cb.lower(root.get("employeeId")), pattern),
                        cb.like(cb.lower(root.get("employeeName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("department").get("name")), pattern),
                        cb.like(cb.lower(root.get("position").get("name")), pattern)
                    ));
                }
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            if (managerDepartmentId != null) {
                // Consistency check: ensure we use the direct department link if possible
                predicates.add(cb.equal(root.get("department").get("id"), managerDepartmentId));
            }

            if (positionId != null) {
                predicates.add(cb.equal(root.get("position").get("id"), positionId));
            }

            if (employmentStatus != null && !employmentStatus.isBlank()) {
                if (employmentStatus.equalsIgnoreCase("Resigned")) {
                    predicates.add(cb.equal(root.get("employmentStatus"), EmployeeStatus.RESIGNED));
                } else if (employmentStatus.equalsIgnoreCase("Terminated")) {
                    predicates.add(cb.equal(root.get("employmentStatus"), EmployeeStatus.TERMINATED));
                } else {
                    // For Probation/Permanent, only show ACTIVE employees
                    predicates.add(cb.or(
                        cb.isNull(root.get("employmentStatus")),
                        cb.equal(root.get("employmentStatus"), EmployeeStatus.ACTIVE)
                    ));

                    Join<Employee, EmployeeProbation> probationJoin = root.join("probation", JoinType.LEFT);
                    
                    if (employmentStatus.equalsIgnoreCase("Probation")) {
                        predicates.add(cb.isNotNull(probationJoin.get("id")));
                    } else if (employmentStatus.equalsIgnoreCase("Permanent")) {
                        predicates.add(cb.isNull(probationJoin.get("id")));
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Employee> employeePage = employeeRepository.findAll(spec, pageable);
        Map<Long, String> currentTransferTypes = loadCurrentTransferTypes(employeePage.getContent());
        List<EmployeeListItemResponseDto> content = employeePage.getContent().stream()
                .map(employee -> toListItemDto(employee, currentTransferTypes.get(employee.getId())))
                .collect(Collectors.toList());

        return EmployeeListResponseDto.builder()
                .content(content)
                .page(employeePage.getNumber())
                .size(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeListResponseDto getEmployees(int page, int size, String search, Long departmentId, Long positionId, String employmentStatus, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, resolveEmployeeSort(sortBy, direction));

        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String[] keywords = search.toLowerCase().split("\\s+");
                for (String keyword : keywords) {
                    if (keyword.isEmpty()) continue;
                    String pattern = "%" + keyword + "%";
                    predicates.add(cb.or(
                        cb.like(cb.lower(root.get("employeeId")), pattern),
                        cb.like(cb.lower(root.get("employeeName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("department").get("name")), pattern),
                        cb.like(cb.lower(root.get("position").get("name")), pattern)
                    ));
                }
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
            }

            if (positionId != null) {
                predicates.add(cb.equal(root.get("position").get("id"), positionId));
            }

            if (employmentStatus != null && !employmentStatus.isBlank()) {
                addEmploymentStatusPredicate(root, cb, predicates, employmentStatus);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Employee> employeePage = employeeRepository.findAll(spec, pageable);
        Map<Long, String> currentTransferTypes = loadCurrentTransferTypes(employeePage.getContent());
        List<EmployeeListItemResponseDto> content = employeePage.getContent().stream()
                .map(employee -> toListItemDto(employee, currentTransferTypes.get(employee.getId())))
                .collect(Collectors.toList());

        return EmployeeListResponseDto.builder()
                .content(content)
                .page(employeePage.getNumber())
                .size(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeDetailResponseDto getEmployeeById(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        return toDetailDto(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeDetailResponseDto getEmployeeByIdForCurrentUser(Long employeeId, UserPrincipal principal) {
        validateCanAccessEmployeeList(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCanViewEmployee(principal, employee);
        return toDetailDto(employee);
    }

    @Transactional
    public void updateEmployee(Long employeeId, EmployeeUpdateRequestDto request, UserPrincipal principal) {
        validateHrOnlyAction(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        employee.setEmployeeId(request.getEmployeeId());
        employee.setEmployeeName(PersonNameNormalizer.normalize(request.getEmployeeName()));
        employee.setEmail(request.getEmail().toLowerCase().trim());
        employee.setStaffNrcNo(request.getStaffNrcNo());
        employee.setGender(request.getGender());
        employee.setReligion(parseReligion(request.getReligion()));
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setProfilePictureUrl(ProfilePictureUrlValidator.normalizeOrNull(request.getProfilePictureUrl()));
        employee.setMaritalStatus(parseMaritalStatus(request.getMaritalStatus()));

        EmployeeFather father = employee.getFather();
        if (father == null) {
            father = new EmployeeFather();
            employee.setFather(father);
        }
        father.setFatherName(request.getFatherName());
        father.setFatherNrcNo(request.getFatherNrcNo());
        father.setFatherOccupation(request.getFatherOccupation());

        EmergencyContact emergencyContact = employee.getEmergencyContact();
        if (emergencyContact == null) {
            emergencyContact = new EmergencyContact();
            employee.setEmergencyContact(emergencyContact);
        }
        emergencyContact.setEmergencyPhone(request.getEmergencyPhone());
        emergencyContact.setRelation(request.getEmergencyRelation());

        if (employee.getMaritalStatus() == MaritalStatus.Married) {
            EmployeeSpouse spouse = employee.getSpouse();
            if (spouse == null) {
                spouse = new EmployeeSpouse();
                employee.setSpouse(spouse);
            }
            spouse.setSpouseName(request.getSpouseName());
            spouse.setSpouseNrc(request.getSpouseNrc());
        } else {
            employee.setSpouse(null);
        }

        // Department and position must only change via transfer APIs.
        if (request.getDepartmentId() != null && employee.getDepartment() != null
                && !request.getDepartmentId().equals(employee.getDepartment().getId())) {
            throw new IllegalArgumentException(
                "Department changes must be done through transfer actions (Temporary Transfer, " +
                "Permanent Transfer, or Return), not through the normal employee edit.");
        }
        DepartmentPosition selectedMapping = departmentPositionRepository.findById(request.getDepartmentPositionId())
                .orElseThrow(() -> new IllegalArgumentException("Department-position mapping not found"));
        if (!isActiveEntity(selectedMapping.getStatus())) {
            throw new IllegalArgumentException("Selected department-position mapping is not active");
        }
        if (selectedMapping.getDepartment() == null || !selectedMapping.getDepartment().getId().equals(request.getDepartmentId())) {
            throw new IllegalArgumentException("Selected mapping does not belong to selected department");
        }
        if (selectedMapping.getPosition() == null || !isActiveEntity(selectedMapping.getPosition().getStatus())) {
            throw new IllegalArgumentException("Selected mapping references an inactive position");
        }
        if (employee.getPosition() != null && !selectedMapping.getPosition().getId().equals(employee.getPosition().getId())) {
            throw new IllegalArgumentException(
                "Position changes must be done through transfer actions (Temporary Transfer, " +
                "Permanent Transfer, or Return), not through the normal employee edit.");
        }
        employee.setDepartmentPosition(selectedMapping);
        employee.setPosition(selectedMapping.getPosition());

        if (request.getStaffTypeId() != null) {
            if (employee.getStaffType() != null
                    && employee.getStaffType().getId() == StaffTypes.PERMANENT
                    && request.getStaffTypeId() == StaffTypes.PROBATION) {
                throw new IllegalArgumentException("Permanent staff cannot be changed to Probation while editing staff");
            }
            StaffType st = staffTypeRepository.findById(request.getStaffTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Staff type not found"));
            employee.setStaffType(st);
        }

        employee.setUpdatedBy(principal.getId());
        employee.setUpdatedDate(Instant.now());

        employeeRepository.save(employee);
        userRepository.findByEmployee_Id(employee.getId()).ifPresent(user -> {
            user.setRole(positionRoleResolutionService.resolveRoleFromLoadedPosition(selectedMapping.getPosition()));
            userRepository.save(user);
        });

        auditService.record(
            AuditActionType.EMPLOYEE_INFO_UPDATED,
            AuditTargetType.EMPLOYEE,
            employee.getId(),
            principal.getId(),
            principal.getRoleId(),
            "HR user updated employee info for employee_id " + employee.getId(),
            null
        );
    }

    @Transactional
    public PasswordActionResponseDto resendTemporaryPassword(Long employeeId, UserPrincipal principal) {
        validateHrOnlyAction(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        
        User user = userRepository.findByEmployee_Id(employee.getId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if (!user.isMustChangePassword()) {
            throw new IllegalArgumentException("Resend only allowed if user must change password");
        }

        if (employee.getEmail() == null || employee.getEmail().isBlank()) {
            throw new IllegalArgumentException("Employee email is missing");
        }

        String tempPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        auditService.record(
            AuditActionType.TEMP_PASSWORD_RESENT,
            AuditTargetType.USER_ACCOUNT,
            user.getId(),
            principal.getId(),
            principal.getRoleId(),
            "HR user resent temporary password for user_account_id " + user.getId(),
            null
        );

        mailService.sendTemporaryPasswordEmail(employee.getEmail(), employee.getEmployeeName(), tempPassword);

        return PasswordActionResponseDto.builder()
                .message("Temporary password sent successfully")
                .employeeId(employee.getId())
                .email(employee.getEmail())
                .actionType("RESEND")
                .build();
    }

    @Transactional
    public PasswordActionResponseDto sendNewTemporaryPassword(Long employeeId, UserPrincipal principal) {
        validateHrOnlyAction(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        
        User user = userRepository.findByEmployee_Id(employee.getId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        if (employee.getEmail() == null || employee.getEmail().isBlank()) {
            throw new IllegalArgumentException("Employee email is missing");
        }

        String tempPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        auditService.record(
            AuditActionType.NEW_TEMP_PASSWORD_SENT,
            AuditTargetType.USER_ACCOUNT,
            user.getId(),
            principal.getId(),
            principal.getRoleId(),
            "HR user sent new temporary password for user_account_id " + user.getId(),
            null
        );

        mailService.sendTemporaryPasswordEmail(employee.getEmail(), employee.getEmployeeName(), tempPassword);

        return PasswordActionResponseDto.builder()
                .message("New temporary password sent successfully")
                .employeeId(employee.getId())
                .email(employee.getEmail())
                .actionType("NEW_PASSWORD")
                .build();
    }

    @Transactional
    public void updateEmploymentStatus(Long employeeId, UpdateEmploymentStatusRequestDto request, UserPrincipal principal) {
        validateHrOnlyAction(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        String currentStatus = determineEmploymentStatus(employee);
        String targetStatus = request.getTargetStatus();
        LocalDate statusEffectiveDate = request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now();
        String newStatus = normalizeTargetDisplayStatus(targetStatus);

        boolean shouldDeactivateUserAccount = false;
        if ("PERMANENT".equalsIgnoreCase(targetStatus)) {
            if (!"Probation".equals(currentStatus)) {
                throw new IllegalArgumentException("Only Probation employees can be changed to Permanent");
            }

            String mode = request.getTransitionMode();
            if (mode == null || mode.isBlank()) {
                throw new IllegalArgumentException("Transition mode is required when changing to Permanent (NOW or CUSTOM)");
            }

            EmployeeProbation probation = employee.getProbation();
            if (probation == null) {
                // Backfill missing probation rows for legacy/incomplete data so Probation -> Permanent can proceed.
                probation = new EmployeeProbation();
                probation.setEmployee(employee);
                probation.setProbationStartDate(employee.getDateOfJoining() != null ? employee.getDateOfJoining() : LocalDate.now());
                probation.setCreatedOn(LocalDateTime.now());
                probation.setCreatedBy(principal.getId());
                employee.setProbation(probation);
            }

            if ("NOW".equalsIgnoreCase(mode)) {
                probation.setProbationEndDate(LocalDate.now());
            } else if ("CUSTOM".equalsIgnoreCase(mode)) {
                if (request.getEffectiveDate() == null) {
                    throw new IllegalArgumentException("Effective date is required for Custom transition");
                }
                if (!request.getEffectiveDate().isAfter(probation.getProbationStartDate())) {
                    throw new IllegalArgumentException("Effective date must be after probation start date (" + probation.getProbationStartDate() + ")");
                }
                probation.setProbationEndDate(request.getEffectiveDate());
            } else {
                throw new IllegalArgumentException("Transition mode must be NOW or CUSTOM");
            }

            // Update staff type to Permanent
            StaffType permanentType = staffTypeRepository.findById(StaffTypes.PERMANENT)
                    .orElseThrow(() -> new IllegalStateException("Permanent staff type not found"));
            employee.setStaffType(permanentType);

            // Update probation audit fields
            probation.setUpdatedOn(LocalDateTime.now());
            probation.setUpdatedBy(principal.getId());

        } else if ("RESIGNED".equalsIgnoreCase(targetStatus) || "TERMINATED".equalsIgnoreCase(targetStatus)) {

            // If current status is Probation, update probation_end_date
            if ("Probation".equals(currentStatus)) {
                if (request.getEffectiveDate() == null) {
                    throw new IllegalArgumentException("Effective date is required when changing from Probation to " + targetStatus);
                }

                EmployeeProbation probation = employee.getProbation();
                if (probation != null) {
                    if (!request.getEffectiveDate().isAfter(probation.getProbationStartDate())) {
                        throw new IllegalArgumentException("Effective date must be after probation start date (" + probation.getProbationStartDate() + ")");
                    }
                    probation.setProbationEndDate(request.getEffectiveDate());
                    probation.setUpdatedOn(LocalDateTime.now());
                    probation.setUpdatedBy(principal.getId());
                }
            }

            // Set employment status
            if ("RESIGNED".equalsIgnoreCase(targetStatus)) {
                employee.setEmploymentStatus(EmployeeStatus.RESIGNED);
            } else {
                employee.setEmploymentStatus(EmployeeStatus.TERMINATED);
            }
            shouldDeactivateUserAccount = true;

        } else {
            throw new IllegalArgumentException("Invalid target status: " + targetStatus + ". Must be PERMANENT, RESIGNED, or TERMINATED");
        }

        recordEmploymentStatusHistory(employee, currentStatus, newStatus, statusEffectiveDate, principal.getId(), request.getReason());
        employee.setStatusEffectiveFrom(statusEffectiveDate);
        employee.setEmploymentStatusReason(normalizeReason(request.getReason()));
        employee.setUpdatedBy(principal.getId());
        employee.setUpdatedDate(Instant.now());
        employeeRepository.save(employee);
        if (shouldDeactivateUserAccount) {
            userRepository.findByEmployee_Id(employee.getId()).ifPresent(user -> {
                user.setActive(false);
                userRepository.save(user);
            });
        }

        auditService.record(
            AuditActionType.EMPLOYMENT_STATUS_UPDATED,
            AuditTargetType.EMPLOYEE,
            employee.getId(),
            principal.getId(),
            principal.getRoleId(),
            "HR updated employment status to " + targetStatus + " for employee_id " + employee.getId(),
            null
        );
    }

    @Transactional(readOnly = true)
    public List<EmploymentStatusHistoryResponseDto> getEmploymentStatusHistory(Long employeeId, UserPrincipal principal) {
        validateHrOnlyAction(principal);
        if (!employeeRepository.existsById(employeeId)) {
            throw new IllegalArgumentException("Employee not found");
        }
        return employmentStatusHistoryRepository.findByEmployee_IdOrderByEffectiveDateDescChangedAtDesc(employeeId)
                .stream()
                .map(this::toEmploymentStatusHistoryDto)
                .collect(Collectors.toList());
    }

    private void recordEmploymentStatusHistory(
            Employee employee,
            String previousStatus,
            String newStatus,
            LocalDate effectiveDate,
            Long changedByUserId,
            String reason) {
        EmploymentStatusHistory history = new EmploymentStatusHistory();
        history.setEmployee(employee);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setEffectiveDate(effectiveDate);
        history.setChangedByUserId(changedByUserId);
        history.setChangedAt(LocalDateTime.now());
        history.setReason(normalizeReason(reason));
        employmentStatusHistoryRepository.save(history);
    }

    private String normalizeTargetDisplayStatus(String targetStatus) {
        if ("PERMANENT".equalsIgnoreCase(targetStatus)) {
            return "Permanent";
        }
        if ("RESIGNED".equalsIgnoreCase(targetStatus)) {
            return "Resigned";
        }
        if ("TERMINATED".equalsIgnoreCase(targetStatus)) {
            return "Terminated";
        }
        throw new IllegalArgumentException("Invalid target status: " + targetStatus + ". Must be PERMANENT, RESIGNED, or TERMINATED");
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }
        return reason.trim();
    }

    private EmploymentStatusHistoryResponseDto toEmploymentStatusHistoryDto(EmploymentStatusHistory history) {
        return EmploymentStatusHistoryResponseDto.builder()
                .id(history.getId())
                .employeeId(history.getEmployee().getId())
                .previousStatus(history.getPreviousStatus())
                .newStatus(history.getNewStatus())
                .effectiveDate(history.getEffectiveDate())
                .changedByUserId(history.getChangedByUserId())
                .changedAt(history.getChangedAt())
                .reason(history.getReason())
                .build();
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }

    private EmployeeReligion parseReligion(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return EmployeeReligion.fromValue(value);
    }

    private MaritalStatus parseMaritalStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return MaritalStatus.valueOf(value.trim());
    }

    private Map<Long, String> loadCurrentTransferTypes(Collection<Employee> employees) {
        List<Long> employeeIds = employees.stream()
                .map(Employee::getId)
                .collect(Collectors.toList());

        if (employeeIds.isEmpty()) {
            return Map.of();
        }

        return employeeDepartmentHistoryRepository.findCurrentTransferTypesByEmployeeIds(employeeIds)
                .stream()
                .collect(Collectors.toMap(
                        EmployeeDepartmentHistoryRepository.CurrentTransferTypeView::getEmployeeId,
                        view -> view.getTransferType() != null ? view.getTransferType().name() : null,
                        (existing, replacement) -> existing));
    }

    private EmployeeListItemResponseDto toListItemDto(Employee employee, String currentTransferType) {
        User user = employee.getUserAccount();
        String employmentStatus = determineEmploymentStatus(employee);
        EmployeeStatus activeStatus = employee.getEmploymentStatus() != null
                ? employee.getEmploymentStatus()
                : EmployeeStatus.ACTIVE;

        return EmployeeListItemResponseDto.builder()
                .employeeId(employee.getId())
                .staffNo(employee.getEmployeeId())
                .employeeName(employee.getEmployeeName())
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .positionName(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .staffTypeId(employee.getStaffType() != null ? employee.getStaffType().getId() : null)
                .staffTypeName(employee.getStaffType() != null ? employee.getStaffType().getName() : null)
                .phoneNumber(employee.getPhoneNo())
                .profilePictureUrl(employee.getProfilePictureUrl())
                .email(employee.getEmail())
                .mustChangePassword(user != null ? user.isMustChangePassword() : null)
                .hasUserAccount(user != null)
                .employmentStatus(employmentStatus)
                .employeeActiveStatus(activeStatus.name())
                .currentTransferType(currentTransferType)
                .build();
    }

    private String determineEmploymentStatus(Employee employee) {
        // If employee is RESIGNED or TERMINATED, show that instead of Probation/Permanent
        EmployeeStatus activeStatus = employee.getEmploymentStatus();
        if (activeStatus == EmployeeStatus.RESIGNED) {
            return "Resigned";
        }
        if (activeStatus == EmployeeStatus.TERMINATED) {
            return "Terminated";
        }

        // Determine from staff_type_id
        if (employee.getStaffType() != null && employee.getStaffType().getId() == StaffTypes.PROBATION) {
            return "Probation";
        }

        return "Permanent";
    }

    private EmployeeDetailResponseDto toDetailDto(Employee employee) {
        Employee manager = resolveDepartmentManager(employee);
        return EmployeeDetailResponseDto.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getEmployeeName())
                .email(employee.getEmail())
                .staffNrcNo(employee.getStaffNrcNo())
                .gender(employee.getGender())
                .religion(employee.getReligion() == null ? null : employee.getReligion().toApiLabel())
                .dateOfBirth(employee.getDateOfBirth())
                .phoneNo(employee.getPhoneNo())
                .address(employee.getAddress())
                .race(employee.getRace())
                .status(employee.getEmploymentStatus() == null ? "ACTIVE" : employee.getEmploymentStatus().name())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .departmentPositionId(employee.getDepartmentPosition() != null ? employee.getDepartmentPosition().getId() : null)
                .positionId(employee.getPosition() != null ? employee.getPosition().getId() : null)
                .positionName(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .managerId(manager != null ? manager.getId() : null)
                .managerName(manager != null ? manager.getEmployeeName() : null)
                .staffTypeId(employee.getStaffType() != null ? employee.getStaffType().getId() : null)
                .staffTypeName(employee.getStaffType() != null ? employee.getStaffType().getName() : null)
                .dateOfJoining(employee.getDateOfJoining())
                .probationStartDate(employee.getProbation() != null ? employee.getProbation().getProbationStartDate() : null)
                .probationEndDate(employee.getProbation() != null ? employee.getProbation().getProbationEndDate() : null)
                .fatherName(employee.getFather() != null ? employee.getFather().getFatherName() : null)
                .fatherNrcNo(employee.getFather() != null ? employee.getFather().getFatherNrcNo() : null)
                .fatherOccupation(employee.getFather() != null ? employee.getFather().getFatherOccupation() : null)
                .emergencyPhone(employee.getEmergencyContact() != null ? employee.getEmergencyContact().getEmergencyPhone() : null)
                .emergencyRelation(employee.getEmergencyContact() != null ? employee.getEmergencyContact().getRelation() : null)
                .profilePictureUrl(employee.getProfilePictureUrl())
                .maritalStatus(employee.getMaritalStatus() == null ? null : employee.getMaritalStatus().name())
                .spouseId(employee.getSpouse() != null ? employee.getSpouse().getSpouseId() : null)
                .spouseName(employee.getSpouse() != null ? employee.getSpouse().getSpouseName() : null)
                .spouseNrc(employee.getSpouse() != null ? employee.getSpouse().getSpouseNrc() : null)
                .build();
    }

    private Employee resolveDepartmentManager(Employee employee) {
        if (employee.getDepartment() == null || employee.getDepartment().getManagerId() == null) {
            return null;
        }
        Long managerId = employee.getDepartment().getManagerId();
        if (employee.getId() != null && employee.getId().equals(managerId)) {
            return null;
        }
        return employeeRepository.findById(managerId).orElse(null);
    }

    private boolean isActiveEntity(String status) {
        return status == null || "active".equalsIgnoreCase(status.trim());
    }

    @Transactional(readOnly = true)
    public EmployeeViewResponseDto getEmployeeViewById(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        return toViewDto(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeViewResponseDto getEmployeeViewByIdForCurrentUser(Long employeeId, UserPrincipal principal) {
        validateCanAccessEmployeeList(principal);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        validateCanViewEmployee(principal, employee);
        return toViewDto(employee);
    }

    public void validateHrOnlyAction(UserPrincipal principal) {
        if (principal == null || principal.getRoleId() == null || principal.getRoleId() != ROLE_HR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is available to HR only");
        }
    }

    private void validateCanAccessEmployeeList(UserPrincipal principal) {
        if (principal == null || principal.getRoleId() == null
                || (principal.getRoleId() != ROLE_HR && principal.getRoleId() != ROLE_DEPARTMENT_MANAGER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access employee records");
        }
    }

    private void validateCanViewEmployee(UserPrincipal principal, Employee target) {
        if (!isDepartmentManager(principal)) {
            return;
        }
        Long viewerDepartmentId = resolveCurrentDepartmentId(principal);
        Long targetDepartmentId = resolveCurrentDepartmentId(target);
        if (targetDepartmentId == null || !viewerDepartmentId.equals(targetDepartmentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to view this employee.");
        }
    }

    private boolean isDepartmentManager(UserPrincipal principal) {
        return principal != null && principal.getRoleId() != null && principal.getRoleId() == ROLE_DEPARTMENT_MANAGER;
    }

    private Long resolveCurrentDepartmentId(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User account not found"));
        Long departmentId = resolveCurrentDepartmentId(user.getEmployee());
        if (departmentId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your department information is not configured. Please contact HR.");
        }
        return departmentId;
    }

    private Long resolveCurrentDepartmentId(Employee employee) {
        if (employee == null || employee.getDepartmentPosition() == null
                || employee.getDepartmentPosition().getDepartment() == null) {
            return null;
        }
        return employee.getDepartmentPosition().getDepartment().getId();
    }

    private Sort resolveEmployeeSort(String sortBy, Sort.Direction direction) {
        if ("staffNo".equals(sortBy)) {
            // Natural sort for numeric staff numbers stored as text (1,2,3...10).
            return JpaSort.unsafe(direction, "LENGTH(employeeId)").and(Sort.by(direction, "employeeId"));
        }
        return switch (sortBy == null ? "" : sortBy) {
            case "employeeName" -> Sort.by(direction, "employeeName");
            case "departmentName" -> Sort.by(direction, "department.name");
            case "positionName" -> Sort.by(direction, "position.name");
            case "staffTypeName" -> Sort.by(direction, "staffType.name");
            case "phoneNumber" -> Sort.by(direction, "phoneNo");
            case "email" -> Sort.by(direction, "email");
            default -> Sort.by(direction, "employeeId");
        };
    }

    private void addEmploymentStatusPredicate(jakarta.persistence.criteria.Root<Employee> root,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            List<Predicate> predicates,
            String employmentStatus) {
        if (employmentStatus.equalsIgnoreCase("Resigned")) {
            predicates.add(cb.equal(root.get("employmentStatus"), EmployeeStatus.RESIGNED));
        } else if (employmentStatus.equalsIgnoreCase("Terminated")) {
            predicates.add(cb.equal(root.get("employmentStatus"), EmployeeStatus.TERMINATED));
        } else {
            predicates.add(cb.or(
                cb.isNull(root.get("employmentStatus")),
                cb.equal(root.get("employmentStatus"), EmployeeStatus.ACTIVE)
            ));

            Join<Employee, EmployeeProbation> probationJoin = root.join("probation", JoinType.LEFT);

            if (employmentStatus.equalsIgnoreCase("Probation")) {
                predicates.add(cb.isNotNull(probationJoin.get("id")));
            } else if (employmentStatus.equalsIgnoreCase("Permanent")) {
                predicates.add(cb.isNull(probationJoin.get("id")));
            }
        }
    }

    private EmployeeViewResponseDto toViewDto(Employee employee) {
        EmployeeViewResponseDto.DepartmentInfo deptInfo = null;
        Department dept = employee.getDepartment();
        if (dept != null) {
            deptInfo = EmployeeViewResponseDto.DepartmentInfo.builder()
                    .departmentId(dept.getId())
                    .departmentName(dept.getName())
                    .build();
        }

        EmployeeViewResponseDto.PositionInfo posInfo = null;
        if (employee.getPosition() != null) {
            posInfo = EmployeeViewResponseDto.PositionInfo.builder()
                    .positionId(employee.getPosition().getId())
                    .positionName(employee.getPosition().getName())
                    .build();
        }

        EmployeeViewResponseDto.StaffTypeInfo staffTypeInfo = null;
        if (employee.getStaffType() != null) {
            staffTypeInfo = EmployeeViewResponseDto.StaffTypeInfo.builder()
                    .staffTypeId(employee.getStaffType().getId())
                    .staffTypeName(employee.getStaffType().getName())
                    .build();
        }

        EmployeeViewResponseDto.EmergencyContactInfo emergencyInfo = null;
        if (employee.getEmergencyContact() != null) {
            emergencyInfo = EmployeeViewResponseDto.EmergencyContactInfo.builder()
                    .employeePhone(employee.getEmergencyContact().getEmergencyPhone())
                    .relation(employee.getEmergencyContact().getRelation())
                    .build();
        }

        EmployeeViewResponseDto.FatherInfo fatherInfo = null;
        if (employee.getFather() != null) {
            fatherInfo = EmployeeViewResponseDto.FatherInfo.builder()
                    .fatherName(employee.getFather().getFatherName())
                    .fatherNrcNo(employee.getFather().getFatherNrcNo())
                    .fatherOccupation(employee.getFather().getFatherOccupation())
                    .build();
        }

        EmployeeViewResponseDto.SpouseInfo spouseInfo = null;
        if (employee.getSpouse() != null) {
            spouseInfo = EmployeeViewResponseDto.SpouseInfo.builder()
                    .spouseId(employee.getSpouse().getSpouseId())
                    .spouseName(employee.getSpouse().getSpouseName())
                    .spouseNrc(employee.getSpouse().getSpouseNrc())
                    .build();
        }

        // Build probation info
        EmployeeViewResponseDto.ProbationInfo probationInfo = null;
        EmployeeProbation probation = employee.getProbation();
        if (probation != null) {
            probationInfo = new EmployeeViewResponseDto.ProbationInfo(
                    true,
                    probation.getProbationStartDate(),
                    probation.getProbationEndDate());
        }

        EmployeeStatus activeStatus = employee.getEmploymentStatus() != null
                ? employee.getEmploymentStatus()
                : EmployeeStatus.ACTIVE;
        String statusDisplay = activeStatus == EmployeeStatus.ACTIVE ? "Active"
                : activeStatus == EmployeeStatus.RESIGNED ? "Resigned"
                : "Terminated";

        return EmployeeViewResponseDto.builder()
                .employeeId(employee.getId())
                .staffNo(employee.getEmployeeId())
                .fullName(employee.getEmployeeName())
                .email(employee.getEmail())
                .phoneNumber(employee.getPhoneNo())
                .gender(employee.getGender() != null ? employee.getGender().name() : null)
                .dateOfBirth(employee.getDateOfBirth())
                .hireDate(employee.getDateOfJoining())
                .status(statusDisplay)
                .profilePictureUrl(employee.getProfilePictureUrl())
                .staffNrcNumber(employee.getStaffNrcNo())
                .address(employee.getAddress())
                .race(employee.getRace())
                .employmentStatus(determineEmploymentStatus(employee))
                .statusEffectiveFrom(employee.getStatusEffectiveFrom())
                .employmentStatusReason(employee.getEmploymentStatusReason())
                .maritalStatus(employee.getMaritalStatus() == null ? null : employee.getMaritalStatus().name())
                .department(deptInfo)
                .position(posInfo)
                .staffType(staffTypeInfo)
                .emergencyContact(emergencyInfo)
                .father(fatherInfo)
                .spouse(spouseInfo)
                .probationInfo(probationInfo)
                .build();
    }
}
