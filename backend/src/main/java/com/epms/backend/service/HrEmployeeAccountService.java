package com.epms.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountRequestDto;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountResponseDto;
import com.epms.backend.dto.hr.MessageResponseDto;
import com.epms.backend.dto.hr.NextStaffNoResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.EmergencyContact;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.EmployeeFather;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.Gender;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.TransferType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.util.PersonNameNormalizer;
import com.epms.backend.validation.MyanmarNrcValidator;
import com.epms.backend.validation.ProfilePictureUrlValidator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HrEmployeeAccountService {

	private static final SecureRandom RANDOM = new SecureRandom();
	private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
	private static final int TEMP_PASSWORD_LENGTH = 8;
	private static final Pattern STAFF_NO_PATTERN = Pattern.compile("^[0-9]+$");
	private static final long HR_ROLE_ID = 1L;
	/** When no numeric staff numbers exist, start at 0001. */
	private static final long STAFF_NO_SEQUENCE_START = 0L;
	private static final long STAFF_TYPE_PERMANENT_ID = 1L;
	private static final long STAFF_TYPE_PROBATION_ID = 2L;
	private static final int DEFAULT_PROBATION_DAYS = 90;
	private static final Set<String> RELIGIONS = Set.of("Buddhist", "Christian", "Muslim", "Hindu");

	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;
	private final DepartmentRepository departmentRepository;
	private final StaffTypeRepository staffTypeRepository;
	private final EmployeeDepartmentHistoryRepository departmentHistoryRepository;
	private final DepartmentPositionRepository departmentPositionRepository;
	private final PositionRoleResolutionService positionRoleResolutionService;
	private final PasswordEncoder passwordEncoder;
	private final MailService mailService;
	private final AuditService auditService;

	@Transactional
	public HrCreateEmployeeAccountResponseDto createAccount(HrCreateEmployeeAccountRequestDto request,
			UserPrincipal principal) {
		if (principal.getRoleId() == null || !principal.getRoleId().equals(HR_ROLE_ID)) {
			throw new IllegalArgumentException("Only HR can create employee accounts");
		}

		String email = normalizeEmail(request.getEmail());
		String employeeName = PersonNameNormalizer.normalize(request.getEmployeeName());
		Gender gender = parseGender(request.getGender());
		String address = requireTrimmed(request.getAddress(), "Address is required");
		validatePersonName(employeeName);
		validatePastDate(request.getDateOfBirth(), "Date of birth must be in the past");
		validateStaffNrc(request.getNrc());
		validateOptionalNrc(request.getFatherNrc());
		String religion = requireTrimmed(request.getReligion(), "Religion is required");
		if (!RELIGIONS.contains(religion)) {
			throw new IllegalArgumentException("Religion must be one of: Buddhist, Christian, Muslim, Hindu");
		}

		String staffNo = request.getStaffNo().trim();
		if (!STAFF_NO_PATTERN.matcher(staffNo).matches()) {
			throw new IllegalArgumentException("Staff number must contain digits only");
		}
		if (employeeRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Email is already in use");
		}
		if (userRepository.existsByEmployee_EmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Email is already in use");
		}
		if (employeeRepository.existsByEmployeeId(staffNo)) {
			throw new IllegalArgumentException("Staff number is already in use");
		}

		Department department = departmentRepository.findById(request.getDepartmentId())
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));
		if (!isActiveEntity(department.getStatus())) {
			throw new IllegalArgumentException("Department is not active");
		}

		// Use department_position_id mapping instead of direct position_id
		DepartmentPosition deptPosition = departmentPositionRepository.findById(request.getDepartmentPositionId())
				.orElseThrow(() -> new IllegalArgumentException("Department-position mapping not found"));

		// Validate the mapping belongs to the selected department
		if (!deptPosition.getDepartment().getId().equals(department.getId())) {
			throw new IllegalArgumentException("Selected position mapping does not belong to the selected department");
		}

		// Validate mapping is active
		if (!"Active".equalsIgnoreCase(deptPosition.getStatus())) {
			throw new IllegalArgumentException("Selected position mapping is not active");
		}

		Position position = deptPosition.getPosition();
		// Validate position is active
		if (!isActiveEntity(position.getStatus())) {
			throw new IllegalArgumentException("Selected position is not active");
		}

		Role accountRole = positionRoleResolutionService.resolveRoleFromLoadedPosition(position);

		boolean probation = "PROBATION".equals(request.getStaffType());
		StaffType staffTypeEntity = staffTypeRepository
				.findById(probation ? STAFF_TYPE_PROBATION_ID : STAFF_TYPE_PERMANENT_ID)
				.orElseThrow(() -> new IllegalStateException("Staff type master data is missing"));
		EmployeeProbation probationEntity = null;
		if (probation) {
			if (request.getProbationStartDate() == null) {
				throw new IllegalArgumentException("Probation start date is required for probationary staff");
			}
			LocalDate start = request.getProbationStartDate();
			LocalDate expectedEnd = start.plusDays(DEFAULT_PROBATION_DAYS);
			if (request.getProbationEndDate() == null || !request.getProbationEndDate().equals(expectedEnd)) {
				throw new IllegalArgumentException("Probation end date must be exactly 90 days after start date");
			}
			probationEntity = new EmployeeProbation();
			probationEntity.setProbationStartDate(start);
			probationEntity.setProbationEndDate(expectedEnd);
			probationEntity.setProbationDays(DEFAULT_PROBATION_DAYS);
		} else if (request.getProbationStartDate() != null || request.getProbationEndDate() != null) {
			throw new IllegalArgumentException("Probation dates must be empty for permanent staff");
		}

		Employee employee = new Employee();
		employee.setEmployeeId(staffNo);
		employee.setEmployeeName(employeeName);
		employee.setEmail(email);
		employee.setGender(gender);
		employee.setDateOfBirth(request.getDateOfBirth());
		employee.setPhoneNo(request.getPhoneNo().trim());
		employee.setAddress(address);
		employee.setReligion(EmployeeReligion.fromValue(religion));
		employee.setNationality(request.getNationality().trim());
		employee.setStaffNrcNo(trimToNull(request.getNrc()));
		employee.setDepartment(department);
		employee.setPosition(position);
		employee.setDepartmentPosition(deptPosition);
		employee.setStaffType(staffTypeEntity);
		employee.setProbation(probationEntity);
		if (probationEntity != null) {
			probationEntity.setEmployee(employee);
			probationEntity.setCreatedOn(LocalDateTime.now());
			probationEntity.setCreatedBy(principal.getId());
		}
		employee.setDateOfJoining(request.getHireDate());
		employee.setCreatedBy(principal.getId());
		employee.setUpdatedBy(principal.getId());
		employee.setCreatedDate(Instant.now());
		employee.setUpdatedDate(Instant.now());
		employee.setProfilePictureUrl(ProfilePictureUrlValidator.normalizeOrNull(request.getProfilePictureUrl()));

		String fatherName = PersonNameNormalizer.normalize(request.getFatherName());
		if (fatherName.isEmpty()) {
			throw new IllegalArgumentException("Father name is required");
		}
		if (fatherName.length() > 100) {
			throw new IllegalArgumentException("Father name must be at most 100 characters");
		}
		EmployeeFather father = new EmployeeFather();
		father.setFatherName(fatherName);
		father.setFatherNrcNo(trimToNull(request.getFatherNrc()));
		father.setFatherOccupation(trimToNull(request.getFatherOccupation()));
		employee.setFather(father);

		EmergencyContact emergencyContact = new EmergencyContact();
		emergencyContact.setEmergencyPhone(request.getEmergencyPhone().trim());
		emergencyContact.setRelation(request.getEmergencyRelation().trim());
		employee.setEmergencyContact(emergencyContact);

		Employee savedEmployee = employeeRepository.save(employee);

		// Auto-create INITIAL department/position history row
		EmployeeDepartmentHistory initialHistory = new EmployeeDepartmentHistory();
		initialHistory.setEmployee(savedEmployee);
		initialHistory.setToDepartment(department);
		initialHistory.setToPosition(position);
		initialHistory.setTransferType(TransferType.INITIAL);
		initialHistory.setEffectiveStartDate(request.getHireDate());
		initialHistory.setCurrent(true);
		initialHistory.setCreatedBy(principal.getId());
		initialHistory.setCreatedOn(java.time.LocalDateTime.now());
		EmployeeDepartmentHistory savedHistory = departmentHistoryRepository.save(initialHistory);

		auditService.record(
				AuditActionType.EMPLOYEE_INITIAL_TRANSFER,
				AuditTargetType.EMPLOYEE,
				savedEmployee.getId(),
				principal.getId(),
				principal.getRoleId(),
				"Initial transfer history created for employee_id " + savedEmployee.getId(),
				("{\"transferHistoryId\":%d,\"toDepartmentId\":%d,\"toPositionId\":%d}")
						.formatted(savedHistory.getId(), department.getId(), position.getId()));

		String temporaryPassword = generateTemporaryPassword();
		User user = new User();
		user.setEmployee(savedEmployee);
		user.setPassword(passwordEncoder.encode(temporaryPassword));
		user.setRole(accountRole);
		user.setActive(true);
		user.setMustChangePassword(true);
		user.setCreatedDate(Instant.now());
		User savedUser = userRepository.save(user);

		String description = "HR user %d created employee account for employee_id %d with role_id %d"
				.formatted(principal.getId(), savedEmployee.getId(), accountRole.getId());
		String metadata = "{\"userAccountId\":%d,\"employeeId\":%d}"
				.formatted(savedUser.getId(), savedEmployee.getId());
		auditService.record(
				AuditActionType.EMPLOYEE_ACCOUNT_CREATED,
				AuditTargetType.EMPLOYEE,
				savedEmployee.getId(),
				principal.getId(),
				principal.getRoleId(),
				description,
				metadata);

		mailService.sendTemporaryPasswordEmail(email, employeeName, temporaryPassword);

		return new HrCreateEmployeeAccountResponseDto(
				savedEmployee.getId(),
				savedEmployee.getEmployeeId(),
				savedUser.getId(),
				employeeName,
				email,
				accountRole.getId(),
				true,
				"Employee account created successfully.");
	}

	@Transactional(readOnly = true)
	public NextStaffNoResponseDto suggestNextStaffNo(UserPrincipal principal) {
		if (principal.getRoleId() == null || !principal.getRoleId().equals(HR_ROLE_ID)) {
			throw new IllegalArgumentException("Only HR can request the next staff number");
		}
		long max = employeeRepository.findMaxNumericStaffNo().orElse(STAFF_NO_SEQUENCE_START);
		long next = max + 1;
		return new NextStaffNoResponseDto(Long.toString(next));
	}

	@Transactional
	public MessageResponseDto resendTemporaryPassword(Long employeeId, UserPrincipal principal) {
		if (principal.getRoleId() == null || !principal.getRoleId().equals(HR_ROLE_ID)) {
			throw new IllegalArgumentException("Only HR can resend temporary passwords");
		}
		Employee employee = employeeRepository.findById(employeeId)
				.orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		User user = userRepository.findByEmployee_Id(employee.getId())
				.orElseThrow(() -> new IllegalArgumentException("No user account for this employee"));

		String temporaryPassword = generateTemporaryPassword();
		user.setPassword(passwordEncoder.encode(temporaryPassword));
		user.setMustChangePassword(true);
		User saved = userRepository.save(user);

		String description = "HR user %d resent temporary password for user_account_id %d"
				.formatted(principal.getId(), saved.getId());
		auditService.record(
				AuditActionType.TEMP_PASSWORD_RESENT,
				AuditTargetType.USER_ACCOUNT,
				saved.getId(),
				principal.getId(),
				principal.getRoleId(),
				description,
				null);

		mailService.sendTemporaryPasswordEmail(employee.getEmail(), employee.getEmployeeName(), temporaryPassword);
		return new MessageResponseDto("Temporary password resent successfully.");
	}

	private static void validatePastDate(LocalDate d, String message) {
		if (d == null) {
			return;
		}
		if (!d.isBefore(LocalDate.now())) {
			throw new IllegalArgumentException(message);
		}
	}

	private static void validatePersonName(String name) {
		if (name.isEmpty()) {
			throw new IllegalArgumentException("Employee name is required");
		}
		if (name.length() > 50) {
			throw new IllegalArgumentException("Employee name must be at most 50 characters");
		}
	}

	private static String normalizeEmail(String email) {
		if (email == null) {
			return "";
		}
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private static String trimToNull(String s) {
		if (s == null) {
			return null;
		}
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}

	private static String requireTrimmed(String s, String message) {
		String t = trimToNull(s);
		if (t == null) {
			throw new IllegalArgumentException(message);
		}
		return t;
	}

	private static Gender parseGender(String value) {
		String normalized = requireTrimmed(value, "Gender is required");
		try {
			return Gender.valueOf(normalized);
		} catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException("Gender must be Male or Female");
		}
	}

	private static void validateStaffNrc(String nrc) {
		if (!MyanmarNrcValidator.isValidRequired(nrc)) {
			throw new IllegalArgumentException("NRC number is required and must be a valid format");
		}
	}

	private static void validateOptionalNrc(String nrc) {
		if (!MyanmarNrcValidator.isValidOptional(nrc)) {
			throw new IllegalArgumentException("Invalid NRC Number format");
		}
	}

	private static boolean isActiveEntity(String status) {
		if (status == null || status.isBlank()) {
			return true;
		}
		return "active".equalsIgnoreCase(status.trim());
	}

	private String generateTemporaryPassword() {
		StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
		for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
			sb.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
		}
		return sb.toString();
	}
}
