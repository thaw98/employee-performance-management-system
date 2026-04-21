package com.epms.backend.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.employee.EmployeeDraftRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.EmergencyContact;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeFather;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.util.PersonNameNormalizer;
import com.epms.backend.validation.ProfilePictureUrlValidator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

	private static final Pattern BUSINESS_EMPLOYEE_ID = Pattern.compile("^[A-Za-z0-9._\\-]{1,20}$");

	private final EmployeeRepository employeeRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;
	private final StaffTypeRepository staffTypeRepository;

	@Transactional
	public EmployeeInfoResponseDto saveDraft(EmployeeDraftRequestDto request, UserPrincipal principal) {
		validateOptionalBusinessEmployeeId(request.getEmployeeId());
		Employee employee = new Employee();
		applyDraft(employee, request, principal, true);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto saveCompleted(EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request, true);
		Employee employee = new Employee();
		applyCompleted(employee, request, principal, true);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto updateDraft(Long id, EmployeeDraftRequestDto request, UserPrincipal principal) {
		validateOptionalBusinessEmployeeId(request.getEmployeeId());
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		applyDraft(employee, request, principal, false);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto updateCompleted(Long id, EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request, false);
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		applyCompleted(employee, request, principal, false);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional(readOnly = true)
	public EmployeeInfoResponseDto getById(Long id) {
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		return toDto(employee);
	}

	@Transactional(readOnly = true)
	public Employee getEmployeeById(Long id) {
		return employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
	}

	@Transactional(readOnly = true)
	public List<EmployeeInfoResponseDto> autocomplete(String keyword) {
		String query = keyword == null ? "" : keyword.trim();
		if (query.isEmpty()) {
			return List.of();
		}
		if (query.matches("^[0-9]+$")) {
			return employeeRepository.findById(Long.parseLong(query)).map(this::toDto).stream().toList();
		}
		return employeeRepository.findTop10ByEmployeeNameContainingIgnoreCaseOrderByIdDesc(query).stream()
				.map(this::toDto)
				.toList();
	}

	private void applyDraft(Employee employee, EmployeeDraftRequestDto request, UserPrincipal principal, boolean isCreate) {
		if (isCreate) {
			employee.setEmployeeId(defaultIfBlank(trimToNull(request.getEmployeeId()), generateDraftStaffNo()));
			String draftName = PersonNameNormalizer.normalize(request.getEmployeeName());
			employee.setEmployeeName(draftName.isEmpty() ? "Draft Employee" : draftName);
			employee.setEmail(defaultIfBlank(trimToNull(request.getEmail()), generateDraftEmail()));
			employee.setDateOfJoining(request.getDateOfJoining() != null ? request.getDateOfJoining() : LocalDate.now());
		}

		if (request.getEmployeeId() != null) {
			employee.setEmployeeId(trimToNull(request.getEmployeeId()));
		}
		if (request.getEmployeeName() != null) {
			String n = PersonNameNormalizer.normalize(request.getEmployeeName());
			if (!n.isEmpty()) {
				employee.setEmployeeName(n);
			}
		}
		if (request.getEmail() != null) {
			employee.setEmail(defaultIfBlank(trimToNull(request.getEmail()), employee.getEmail()));
		}
		if (request.getDateOfJoining() != null) {
			employee.setDateOfJoining(request.getDateOfJoining());
		}
		if (request.getGender() != null) {
			employee.setGender(request.getGender());
		}
		if (request.getProfilePictureUrl() != null) {
			employee.setProfilePictureUrl(ProfilePictureUrlValidator.normalizeOrNull(request.getProfilePictureUrl()));
		}

		employee.setStaffNrcNo(firstNonNull(trimToNull(request.getStaffNrcNo()), employee.getStaffNrcNo()));
		employee.setReligion(firstNonNull(normalizeReligion(request.getReligion()), employee.getReligion()));

		applyDepartmentAndPosition(employee, request.getDepartmentId(), request.getPositionId(), false);
		applyManager(employee, request.getManagerId(), false);
		applyStaffType(employee, request.getStaffTypeId(), false);
		applyProbation(employee, request.getProbationMonth(), request.getProbationEndDate());
		applyFather(employee, request.getFatherName(), request.getFatherNrcNo(), request.getFatherOccupation());
		applyEmergencyContact(employee, request.getEmergencyPhone(), request.getEmergencyRelation());
	}

	private void applyCompleted(Employee employee, EmployeeInfoRequestDto request, UserPrincipal principal, boolean isCreate) {
		employee.setEmployeeId(trimToNull(request.getEmployeeId()));
		employee.setEmployeeName(PersonNameNormalizer.normalize(request.getEmployeeName()));
		employee.setEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
		employee.setStaffNrcNo(trimToNull(request.getStaffNrcNo()));
		employee.setGender(request.getGender());
		employee.setReligion(normalizeReligion(request.getReligion()));
		employee.setDateOfJoining(request.getDateOfJoining());

		if (request.getProfilePictureUrl() != null) {
			employee.setProfilePictureUrl(ProfilePictureUrlValidator.normalizeOrNull(request.getProfilePictureUrl()));
		}

		applyDepartmentAndPosition(employee, request.getDepartmentId(), request.getPositionId(), true);
		applyManager(employee, request.getManagerId(), true);
		applyStaffType(employee, request.getStaffTypeId(), true);
		applyProbation(employee, request.getProbationMonth(), request.getProbationEndDate());
		applyFather(employee, request.getFatherName(), request.getFatherNrcNo(), request.getFatherOccupation());
		applyEmergencyContact(employee, request.getEmergencyPhone(), request.getEmergencyRelation());
	}

	private void applyDepartmentAndPosition(Employee employee, Long departmentId, Long positionId, boolean required) {
		Department department = null;
		if (departmentId != null) {
			department = departmentRepository.findById(departmentId)
					.orElseThrow(() -> new IllegalArgumentException("Invalid department"));
			employee.setDepartment(department);
			employee.setParentDepartment(department);
		} else if (required) {
			throw new IllegalArgumentException("Department is required");
		} else {
			employee.setDepartment(null);
			employee.setParentDepartment(null);
		}

		if (positionId != null) {
			Position position = positionRepository.findById(positionId)
					.orElseThrow(() -> new IllegalArgumentException("Invalid position"));
			if (department == null) {
				throw new IllegalArgumentException("Position requires a department");
			}
			assertPositionBelongsToDepartment(position, department);
			employee.setPosition(position);
		} else if (required) {
			throw new IllegalArgumentException("Position is required");
		} else {
			employee.setPosition(null);
		}
	}

	private void applyManager(Employee employee, Long managerId, boolean required) {
		if (managerId == null) {
			if (required) {
				employee.setManager(null);
			}
			return;
		}
		if (employee.getId() != null && employee.getId().equals(managerId)) {
			throw new IllegalArgumentException("Employee cannot be their own manager");
		}
		Employee manager = employeeRepository.findById(managerId)
				.orElseThrow(() -> new IllegalArgumentException("Invalid manager"));
		employee.setManager(manager);
	}

	private void applyStaffType(Employee employee, Long staffTypeId, boolean required) {
		if (staffTypeId == null) {
			if (required) {
				throw new IllegalArgumentException("Staff type is required");
			}
			employee.setStaffType(null);
			return;
		}
		StaffType staffType = staffTypeRepository.findById(staffTypeId)
				.orElseThrow(() -> new IllegalArgumentException("Invalid staff type"));
		employee.setStaffType(staffType);
	}

	private void applyProbation(Employee employee, Integer probationMonth, LocalDate probationEndDate) {
		boolean onProbation = employee.getStaffType() != null && employee.getStaffType().getId() == StaffTypes.PROBATION;
		if (!onProbation) {
			if (employee.getProbation() != null) {
				employee.getProbation().setEmployee(null);
			}
			employee.setProbation(null);
			return;
		}

		LocalDate startDate = employee.getDateOfJoining();
		if (startDate == null) {
			throw new IllegalArgumentException("Date of joining is required for probation staff");
		}

		boolean fixed = probationMonth != null && (probationMonth == 1 || probationMonth == 3 || probationMonth == 6);
		if (probationMonth != null && !fixed) {
			throw new IllegalArgumentException("Probation duration must be 1, 3, or 6 months");
		}

		EmployeeProbation probation = employee.getProbation();
		if (probation == null) {
			probation = new EmployeeProbation();
			probation.setEmployee(employee);
			employee.setProbation(probation);
		}

		probation.setProbationStartDate(startDate);
		if (fixed) {
			probation.setProbationMonth(probationMonth);
			probation.setProbationEndDate(startDate.plusMonths(probationMonth));
			return;
		}

		if (probationEndDate == null) {
			throw new IllegalArgumentException("Probation end date is required for probation staff");
		}
		if (probationEndDate.isBefore(startDate)) {
			throw new IllegalArgumentException("Probation end date must be on or after joining date");
		}
		probation.setProbationMonth(null);
		probation.setProbationEndDate(probationEndDate);
	}

	private void applyFather(Employee employee, String fatherName, String fatherNrcNo, String fatherOccupation) {
		String normalizedName = trimToNull(PersonNameNormalizer.normalize(fatherName));
		String normalizedNrcNo = trimToNull(fatherNrcNo);
		String normalizedOccupation = trimToNull(fatherOccupation);

		if (normalizedName == null && normalizedNrcNo == null && normalizedOccupation == null) {
			employee.setFather(null);
			return;
		}

		EmployeeFather father = employee.getFather();
		if (father == null) {
			father = new EmployeeFather();
			employee.setFather(father);
		}
		father.setFatherName(normalizedName);
		father.setFatherNrcNo(normalizedNrcNo);
		father.setFatherOccupation(normalizedOccupation);
	}

	private void applyEmergencyContact(Employee employee, String phone, String relation) {
		String normalizedPhone = trimToNull(phone);
		String normalizedRelation = trimToNull(relation);
		if (normalizedPhone == null && normalizedRelation == null) {
			employee.setEmergencyContact(null);
			return;
		}

		EmergencyContact contact = employee.getEmergencyContact();
		if (contact == null) {
			contact = new EmergencyContact();
			employee.setEmergencyContact(contact);
		}
		contact.setEmergencyPhone(normalizedPhone);
		contact.setRelation(normalizedRelation);
	}

	private static void assertPositionBelongsToDepartment(Position position, Department department) {
		Department positionDepartment = position.getDepartment();
		if (positionDepartment != null && !positionDepartment.getId().equals(department.getId())) {
			throw new IllegalArgumentException("Position does not belong to the selected department");
		}
	}

	private void validateRequiredBusinessRules(EmployeeInfoRequestDto request, boolean isCreate) {
		String trimmedEmpId = trimToNull(request.getEmployeeId());
		if (isCreate) {
			if (trimmedEmpId == null) {
				throw new IllegalArgumentException("Employee ID is required.");
			}
			validateBusinessEmployeeIdFormat(trimmedEmpId);
		} else if (request.getEmployeeId() != null) {
			validateBusinessEmployeeIdFormat(trimmedEmpId);
		}

		validateJoiningDate(request.getDateOfJoining());

		if (request.getStaffTypeId() == StaffTypes.PROBATION && request.getProbationMonth() == null
				&& request.getProbationEndDate() == null) {
			throw new IllegalArgumentException("Probation month or probation end date is required for probation staff");
		}
	}

	private void validateOptionalBusinessEmployeeId(String raw) {
		String value = trimToNull(raw);
		if (value != null) {
			validateBusinessEmployeeIdFormat(value);
		}
	}

	private void validateBusinessEmployeeIdFormat(String value) {
		if (!BUSINESS_EMPLOYEE_ID.matcher(value).matches()) {
			throw new IllegalArgumentException(
					"Employee ID may use letters, digits, dots, underscores, and hyphens (1-20 characters).");
		}
	}

	private void validateJoiningDate(LocalDate dateOfJoining) {
		LocalDate systemToday = LocalDate.now();
		LocalDate utcToday = LocalDate.now(ZoneOffset.UTC);
		if (dateOfJoining.isAfter(systemToday) && dateOfJoining.isAfter(utcToday)) {
			throw new IllegalArgumentException("Date of joining cannot be in the future");
		}
	}

	private String normalizeReligion(String religion) {
		String value = trimToNull(religion);
		if (value == null) {
			return null;
		}
		List<String> allowed = List.of("Buddhist", "Christian", "Hindu", "Muslim");
		return allowed.stream()
				.filter(option -> option.equalsIgnoreCase(value))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Religion must be Buddhist, Christian, Hindu, or Muslim"));
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private static String defaultIfBlank(String value, String fallback) {
		return value == null ? fallback : value;
	}

	private static <T> T firstNonNull(T value, T fallback) {
		return value != null ? value : fallback;
	}

	private String generateDraftStaffNo() {
		return "DRAFT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
	}

	private String generateDraftEmail() {
		return "draft-" + UUID.randomUUID().toString().substring(0, 8).toLowerCase(Locale.ROOT) + "@placeholder.local";
	}

	private EmployeeInfoResponseDto toDto(Employee employee) {
		return EmployeeInfoResponseDto.builder()
				.id(employee.getId())
				.employeeId(employee.getEmployeeId())
				.employeeName(employee.getEmployeeName())
				.email(employee.getEmail())
				.staffNrcNo(employee.getStaffNrcNo())
				.gender(employee.getGender())
				.religion(employee.getReligion())
				.departmentId(employee.getDepartment() == null ? null : employee.getDepartment().getId())
				.departmentName(employee.getDepartment() == null ? null : employee.getDepartment().getName())
				.positionId(employee.getPosition() == null ? null : employee.getPosition().getId())
				.positionName(employee.getPosition() == null ? null : employee.getPosition().getName())
				.managerId(employee.getManager() == null ? null : employee.getManager().getId())
				.managerName(employee.getManager() == null ? null : employee.getManager().getEmployeeName())
				.staffTypeId(employee.getStaffType() == null ? null : employee.getStaffType().getId())
				.staffTypeName(employee.getStaffType() == null ? null : employee.getStaffType().getName())
				.dateOfJoining(employee.getDateOfJoining())
				.probationMonth(employee.getProbation() == null ? null : employee.getProbation().getProbationMonth())
				.probationEndDate(employee.getProbation() == null ? null : employee.getProbation().getProbationEndDate())
				.fatherName(employee.getFather() == null ? null : employee.getFather().getFatherName())
				.fatherNrcNo(employee.getFather() == null ? null : employee.getFather().getFatherNrcNo())
				.fatherOccupation(employee.getFather() == null ? null : employee.getFather().getFatherOccupation())
				.emergencyPhone(employee.getEmergencyContact() == null ? null : employee.getEmergencyContact().getEmergencyPhone())
				.emergencyRelation(employee.getEmergencyContact() == null ? null : employee.getEmergencyContact().getRelation())
				.profilePictureUrl(employee.getProfilePictureUrl())
				.build();
	}
}
