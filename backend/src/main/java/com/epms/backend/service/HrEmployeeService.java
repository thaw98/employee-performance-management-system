package com.epms.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.hr.EmployeeDetailResponseDto;
import com.epms.backend.dto.hr.EmployeeViewResponseDto;
import com.epms.backend.dto.hr.EmployeeListItemResponseDto;
import com.epms.backend.dto.hr.EmployeeListResponseDto;
import com.epms.backend.dto.hr.EmployeeUpdateRequestDto;
import com.epms.backend.dto.hr.PasswordActionResponseDto;
import com.epms.backend.dto.hr.UpdateEmploymentStatusRequestDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
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
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final StaffTypeRepository staffTypeRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AuditService auditService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 8;

    @Transactional(readOnly = true)
    public EmployeeListResponseDto getEmployees(int page, int size, String search, Long departmentId, Long positionId, String employmentStatus, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort;
        if (sortBy.equals("staffNo")) {
            // Natural sort for numeric staff numbers stored as text (1,2,3...10).
            sort = JpaSort.unsafe(direction, "LENGTH(employeeId)").and(Sort.by(direction, "employeeId"));
        } else {
            sort = Sort.by(direction, sortBy);
        }
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("employeeId")), pattern),
                    cb.like(cb.lower(root.get("employeeName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("department").get("name")), pattern),
                    cb.like(cb.lower(root.get("position").get("name")), pattern)
                ));
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("id"), departmentId));
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
        List<EmployeeListItemResponseDto> content = employeePage.getContent().stream()
                .map(this::toListItemDto)
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

    @Transactional
    public void updateEmployee(Long employeeId, EmployeeUpdateRequestDto request, UserPrincipal principal) {
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

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            employee.setDepartment(dept);
            employee.setParentDepartment(dept);
        }

        if (request.getPositionId() != null) {
            Position pos = positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new IllegalArgumentException("Position not found"));
            employee.setPosition(pos);
        }

        if (request.getStaffTypeId() != null) {
            StaffType st = staffTypeRepository.findById(request.getStaffTypeId())
                    .orElseThrow(() -> new IllegalArgumentException("Staff type not found"));
            employee.setStaffType(st);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
            employee.setManager(manager);
        } else {
            employee.setManager(null);
        }

        employee.setUpdatedBy(principal.getId());
        employee.setUpdatedDate(Instant.now());

        employeeRepository.save(employee);

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
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        String status = request.getStatus();

        if ("Permanent".equalsIgnoreCase(status)) {
            if (employee.getProbation() != null) {
                employee.getProbation().setProbationEndDate(LocalDate.now().minusDays(1));
            }
        } else if ("Probation".equalsIgnoreCase(status)) {
            if (request.getProbationEndDate() == null) {
                throw new IllegalArgumentException("Probation end date is required when setting status to Probation");
            }
            if (!request.getProbationEndDate().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Probation end date must be in the future");
            }
            EmployeeProbation probation = employee.getProbation();
            if (probation == null) {
                probation = new EmployeeProbation();
                probation.setEmployee(employee);
                employee.setProbation(probation);
            }
            probation.setProbationEndDate(request.getProbationEndDate());
            probation.setProbationStartDate(LocalDate.now());
        } else if ("Resigned".equalsIgnoreCase(status)) {
            employee.setEmploymentStatus(EmployeeStatus.RESIGNED);
        } else if ("Terminated".equalsIgnoreCase(status)) {
            employee.setEmploymentStatus(EmployeeStatus.TERMINATED);
        } else {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        employee.setUpdatedBy(principal.getId());
        employee.setUpdatedDate(Instant.now());
        employeeRepository.save(employee);

        auditService.record(
            AuditActionType.EMPLOYMENT_STATUS_UPDATED,
            AuditTargetType.EMPLOYEE,
            employee.getId(),
            principal.getId(),
            principal.getRoleId(),
            "HR updated employment status to " + status + " for employee_id " + employee.getId(),
            null
        );
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

    private EmployeeListItemResponseDto toListItemDto(Employee employee) {
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
                .profilePictureUrl(employee.getProfilePictureUrl())
                .email(employee.getEmail())
                .mustChangePassword(user != null ? user.isMustChangePassword() : null)
                .hasUserAccount(user != null)
                .employmentStatus(employmentStatus)
                .employeeActiveStatus(activeStatus.name())
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

        EmployeeProbation probation = employee.getProbation();
        if (probation != null) {
            return "Probation";
        }

        return "Permanent";
    }

    private EmployeeDetailResponseDto toDetailDto(Employee employee) {
        return EmployeeDetailResponseDto.builder()
                .id(employee.getId())
                .employeeId(employee.getEmployeeId())
                .employeeName(employee.getEmployeeName())
                .email(employee.getEmail())
                .staffNrcNo(employee.getStaffNrcNo())
                .gender(employee.getGender())
                .religion(employee.getReligion() == null ? null : employee.getReligion().toApiLabel())
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .positionId(employee.getPosition() != null ? employee.getPosition().getId() : null)
                .positionName(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .managerName(employee.getManager() != null ? employee.getManager().getEmployeeName() : null)
                .staffTypeId(employee.getStaffType() != null ? employee.getStaffType().getId() : null)
                .staffTypeName(employee.getStaffType() != null ? employee.getStaffType().getName() : null)
                .dateOfJoining(employee.getDateOfJoining())
                .profilePictureUrl(employee.getProfilePictureUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeViewResponseDto getEmployeeViewById(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        return toViewDto(employee);
    }

    private EmployeeViewResponseDto toViewDto(Employee employee) {
        EmployeeViewResponseDto.DepartmentInfo deptInfo = null;
        Department dept = employee.getParentDepartment() != null ? employee.getParentDepartment() : employee.getDepartment();
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
                .nationality(employee.getNationality())
                .employmentStatus(determineEmploymentStatus(employee))
                .department(deptInfo)
                .position(posInfo)
                .staffType(staffTypeInfo)
                .emergencyContact(emergencyInfo)
                .father(fatherInfo)
                .build();
    }
}
