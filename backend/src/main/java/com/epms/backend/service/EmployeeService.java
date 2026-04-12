package com.epms.backend.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
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
import com.epms.backend.entity.EmployeeSpouse;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.Passport;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Religion;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

	/** Business {@code employees.employee_id}: letters, digits, dots, underscores, hyphens (column length 100). */
	private static final Pattern BUSINESS_EMPLOYEE_ID = Pattern.compile("^[A-Za-z0-9._\\-]{1,100}$");

	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;
	private final ReligionRepository religionRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;
	private final StaffTypeRepository staffTypeRepository;

	@Transactional
	public EmployeeInfoResponseDto saveDraft(EmployeeDraftRequestDto request, UserPrincipal principal) {
		validateOptionalBusinessEmployeeId(request.getEmployeeId());
		Employee employee = new Employee();
		applyDraft(employee, request, "DRAFT", principal.getId(), true);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto saveCompleted(EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request, true);
		return save(request, principal, "COMPLETED");
	}

	@Transactional
	public EmployeeInfoResponseDto updateDraft(Long id, EmployeeDraftRequestDto request, UserPrincipal principal) {
		validateOptionalBusinessEmployeeId(request.getEmployeeId());
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		applyDraft(employee, request, "DRAFT", principal.getId(), false);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto updateCompleted(Long id, EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request, false);
		return update(id, request, principal, "COMPLETED");
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

	private EmployeeInfoResponseDto save(EmployeeInfoRequestDto request, UserPrincipal principal, String status) {
		Employee employee = new Employee();
		apply(employee, request, status, principal.getId(), true);
		return toDto(employeeRepository.save(employee));
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String t = value.trim();
		return t.isEmpty() ? null : t;
	}

	private static String fatherName(Employee e) {
		if (e.getFather() == null) {
			return null;
		}
		return e.getFather().getFatherName();
	}

	private static String fatherNrcNo(Employee e) {
		if (e.getFather() == null) {
			return null;
		}
		return e.getFather().getFatherNrcNo();
	}

	private static String fatherOccupation(Employee e) {
		if (e.getFather() == null) {
			return null;
		}
		return e.getFather().getFatherOccupation();
	}

	private static String spouseName(Employee e) {
		if (e.getSpouse() == null) {
			return null;
		}
		return e.getSpouse().getSpouseName();
	}

	private static String spouseNrcNo(Employee e) {
		if (e.getSpouse() == null) {
			return null;
		}
		return e.getSpouse().getSpouseNrcNo();
	}

	private static String spouseOccupation(Employee e) {
		if (e.getSpouse() == null) {
			return null;
		}
		return e.getSpouse().getSpouseOccupation();
	}

	private static String passportNo(Employee e) {
		if (e.getPassport() == null) {
			return null;
		}
		return e.getPassport().getPassportNo();
	}

	private static LocalDate passportExpireDate(Employee e) {
		if (e.getPassport() == null) {
			return null;
		}
		return e.getPassport().getPassportExpireDate();
	}

	private void applyDraft(Employee employee, EmployeeDraftRequestDto r, String status, Long actorId, boolean isCreate) {
		if (r.getEmployeeId() != null) {
			employee.setEmployeeId(trimToNull(r.getEmployeeId()));
		}
		employee.setEmployeeName(trimToNull(r.getEmployeeName()));
		employee.setOtherName(trimToNull(r.getOtherName()));

		employee.setStaffNrcNo(trimToNull(r.getStaffNrcNo()));

		employee.setGender(r.getGender());
		employee.setRace(trimToNull(r.getRace()));

		if (r.getReligionId() != null) {
			Religion religion = religionRepository.findById(r.getReligionId()).orElseThrow(() -> new IllegalArgumentException("Invalid religion"));
			employee.setReligion(religion);
		} else {
			employee.setReligion(null);
		}

		employee.setDateOfBirth(r.getDateOfBirth());
		employee.setBirthPlace(trimToNull(r.getBirthPlace()));
		employee.setContactAddress(trimToNull(r.getContactAddress()));
		employee.setPermanentAddress(trimToNull(r.getPermanentAddress()));
		employee.setPhoneNo(trimToNull(r.getPhoneNo()));
		employee.setMaritalStatus(r.getMaritalStatus());
		applySpouse(employee, trimToNull(r.getSpouseName()), trimToNull(r.getSpouseNrcNo()), trimToNull(r.getSpouseOccupation()));
		applyFather(employee, trimToNull(r.getFatherName()), trimToNull(r.getFatherNrcNo()), trimToNull(r.getFatherOccupation()));

		Department department = null;
		if (r.getDepartmentId() != null) {
			department = departmentRepository.findById(r.getDepartmentId()).orElseThrow(() -> new IllegalArgumentException("Invalid department"));
			employee.setDepartment(department);
		} else {
			employee.setDepartment(null);
		}
		if (r.getPositionId() != null) {
			Position position = positionRepository.findById(r.getPositionId()).orElseThrow(() -> new IllegalArgumentException("Invalid position"));
			if (department == null) {
				throw new IllegalArgumentException("Position requires a department");
			}
			assertPositionBelongsToDepartment(position, department);
			employee.setPosition(position);
		} else {
			employee.setPosition(null);
		}
		employee.setNationality(trimToNull(r.getNationality()));

		employee.setDateOfJoining(r.getDateOfJoining());
		applyPassport(employee, trimToNull(r.getPassportNo()), r.getPassportExpireDate());
		employee.setDateOfDemotion(r.getDateOfDemotion());
		employee.setDateOfTitleChange(r.getDateOfTitleChange());
		employee.setDateOfPromotion(r.getDateOfPromotion());
		employee.setDateOfTransfer(r.getDateOfTransfer());
		employee.setRecordStatus(status);

		applyStaffType(employee, r.getStaffTypeId());
		applyProbation(employee, isProbationStaffType(employee), r.getProbationStartDate(), r.getDateOfJoining(),
				r.getProbationMonth(), r.getProbationEndDate());

		applyEmergencyContact(employee, r.getEmergencyPhone(), r.getEmergencyRelation());

		if (isCreate) {
			employee.setCreatedBy(actorId);
		}
		employee.setUpdatedBy(actorId);
	}

	private EmployeeInfoResponseDto update(Long id, EmployeeInfoRequestDto request, UserPrincipal principal, String status) {
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		apply(employee, request, status, principal.getId(), false);
		return toDto(employeeRepository.save(employee));
	}

	private void apply(Employee employee, EmployeeInfoRequestDto request, String status, Long actorId, boolean isCreate) {
		Religion religion = religionRepository.findById(request.getReligionId()).orElseThrow(() -> new IllegalArgumentException("Invalid religion"));
		Department department = departmentRepository.findById(request.getDepartmentId()).orElseThrow(() -> new IllegalArgumentException("Invalid department"));
		Position position = positionRepository.findById(request.getPositionId()).orElseThrow(() -> new IllegalArgumentException("Invalid position"));
		assertPositionBelongsToDepartment(position, department);

		if (isCreate) {
			employee.setEmployeeId(trimToNull(request.getEmployeeId()));
		} else if (request.getEmployeeId() != null) {
			employee.setEmployeeId(trimToNull(request.getEmployeeId()));
		}
		employee.setEmployeeName(request.getEmployeeName().trim());
		employee.setOtherName(request.getOtherName());
		employee.setStaffNrcNo(request.getStaffNrcNo().trim());
		employee.setGender(request.getGender());
		employee.setRace(request.getRace().trim());
		employee.setReligion(religion);
		employee.setDateOfBirth(request.getDateOfBirth());
		employee.setBirthPlace(request.getBirthPlace());
		employee.setContactAddress(request.getContactAddress());
		employee.setPermanentAddress(request.getPermanentAddress());
		employee.setPhoneNo(request.getPhoneNo().trim());
		employee.setMaritalStatus(request.getMaritalStatus());
		applySpouse(employee, trimToNull(request.getSpouseName()), trimToNull(request.getSpouseNrcNo()),
				trimToNull(request.getSpouseOccupation()));
		applyFather(employee, trimToNull(request.getFatherName()), trimToNull(request.getFatherNrcNo()),
				trimToNull(request.getFatherOccupation()));
		employee.setDepartment(department);
		employee.setPosition(position);
		employee.setNationality(request.getNationality().trim());
		employee.setDateOfJoining(request.getDateOfJoining());
		applyPassport(employee, trimToNull(request.getPassportNo()), request.getPassportExpireDate());
		employee.setDateOfDemotion(request.getDateOfDemotion());
		employee.setDateOfTitleChange(request.getDateOfTitleChange());
		employee.setDateOfPromotion(request.getDateOfPromotion());
		employee.setDateOfTransfer(request.getDateOfTransfer());
		employee.setRecordStatus(status);

		StaffType staffType = staffTypeRepository.findById(request.getStaffTypeId())
				.orElseThrow(() -> new IllegalArgumentException("Invalid staff type"));
		employee.setStaffType(staffType);
		applyProbation(employee, staffType.getId().longValue() == StaffTypes.PROBATION, request.getProbationStartDate(),
				request.getDateOfJoining(), request.getProbationMonth(), request.getProbationEndDate());

		applyEmergencyContact(employee, request.getEmergencyPhone(), request.getEmergencyRelation());

		if (request.getProfilePictureBase64() != null) {
			employee.setProfilePictureBase64(trimToNull(request.getProfilePictureBase64()));
		}

		if (isCreate) {
			employee.setCreatedBy(actorId);
		}
		employee.setUpdatedBy(actorId);
	}

	private void applyStaffType(Employee employee, Long staffTypeId) {
		if (staffTypeId == null) {
			employee.setStaffType(null);
			return;
		}
		StaffType staffType = staffTypeRepository.findById(staffTypeId)
				.orElseThrow(() -> new IllegalArgumentException("Invalid staff type"));
		employee.setStaffType(staffType);
	}

	private static boolean isProbationStaffType(Employee employee) {
		return employee.getStaffType() != null && employee.getStaffType().getId().longValue() == StaffTypes.PROBATION;
	}

	private void applyProbation(Employee employee, boolean onProbation, LocalDate probationStartDate, LocalDate dateOfJoining,
			Integer probationMonth, LocalDate probationEndDate) {
		if (!onProbation) {
			employee.setProbation(null);
			return;
		}
		LocalDate startDate = probationStartDate != null ? probationStartDate : dateOfJoining;
		if (startDate == null) {
			employee.setProbation(null);
			return;
		}
		boolean fixed = probationMonth != null && (probationMonth == 1 || probationMonth == 3 || probationMonth == 6);
		if (fixed) {
			EmployeeProbation p = employee.getProbation();
			if (p == null) {
				p = new EmployeeProbation();
				p.setEmployee(employee);
				employee.setProbation(p);
			}
			p.setProbationMonth(probationMonth);
			p.setProbationStartDate(startDate);
			p.setProbationEndDate(startDate.plusMonths(probationMonth));
			return;
		}
		if (probationEndDate != null) {
			if (probationEndDate.isBefore(startDate)) {
				throw new IllegalArgumentException("Probation end date must be on or after probation start date");
			}
			EmployeeProbation p = employee.getProbation();
			if (p == null) {
				p = new EmployeeProbation();
				p.setEmployee(employee);
				employee.setProbation(p);
			}
			p.setProbationMonth(null);
			p.setProbationStartDate(startDate);
			p.setProbationEndDate(probationEndDate);
			return;
		}
		employee.setProbation(null);
	}

	private void applySpouse(Employee employee, String spouseName, String spouseNrcNo, String spouseOccupation) {
		if (spouseName == null && spouseNrcNo == null && spouseOccupation == null) {
			employee.setSpouse(null);
			return;
		}
		EmployeeSpouse s = employee.getSpouse();
		if (s == null) {
			s = new EmployeeSpouse();
			employee.setSpouse(s);
			s.setEmployee(employee);
		}
		s.setSpouseName(spouseName);
		s.setSpouseNrcNo(spouseNrcNo);
		s.setSpouseOccupation(spouseOccupation);
	}

	private void applyPassport(Employee employee, String passportNo, LocalDate passportExpireDate) {
		if (passportNo == null && passportExpireDate == null) {
			employee.setPassport(null);
			return;
		}
		Passport p = employee.getPassport();
		if (p == null) {
			p = new Passport();
			employee.setPassport(p);
		}
		p.setPassportNo(passportNo);
		p.setPassportExpireDate(passportExpireDate);
	}

	private void applyFather(Employee employee, String fatherName, String fatherNrcNo, String fatherOccupation) {
		if (fatherName == null && fatherNrcNo == null && fatherOccupation == null) {
			employee.setFather(null);
			return;
		}
		EmployeeFather f = employee.getFather();
		if (f == null) {
			f = new EmployeeFather();
			employee.setFather(f);
			f.setEmployee(employee);
		}
		f.setFatherName(fatherName);
		f.setFatherNrcNo(fatherNrcNo);
		f.setFatherOccupation(fatherOccupation);
	}

	private void applyEmergencyContact(Employee employee, String phone, String relation) {
		String p = trimToNull(phone);
		String r = trimToNull(relation);

		if (p == null && r == null) {
			employee.setEmergencyContact(null);
			return;
		}

		EmergencyContact contact = employee.getEmergencyContact();
		if (contact == null) {
			contact = new EmergencyContact();
			contact.setEmployee(employee);
			employee.setEmergencyContact(contact);
		}
		contact.setEmergencyPhone(p);
		contact.setRelation(r);
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
		} else {
			if (request.getEmployeeId() != null && trimmedEmpId == null) {
				throw new IllegalArgumentException("Employee ID cannot be blank.");
			}
			if (trimmedEmpId != null) {
				validateBusinessEmployeeIdFormat(trimmedEmpId);
			}
		}
		if (request.getDateOfBirth().isAfter(LocalDate.now())) {
			throw new IllegalArgumentException("Date of birth must be in the past");
		}
		// Date-only values from the client often follow the UTC calendar (e.g. HTML max = ISO date).
		// Reject only if the date is strictly after "today" in both the JVM default zone and UTC,
		// so the same civil date is not rejected when zones disagree at day boundaries.
		LocalDate systemToday = LocalDate.now();
		LocalDate utcToday = LocalDate.now(ZoneOffset.UTC);
		LocalDate doj = request.getDateOfJoining();
		if (doj.isAfter(systemToday) && doj.isAfter(utcToday)) {
			throw new IllegalArgumentException("Date of joining cannot be in the future");
		}
		if (request.getStaffTypeId().longValue() == StaffTypes.PROBATION) {
			LocalDate start = request.getProbationStartDate() != null ? request.getProbationStartDate() : request.getDateOfJoining();
			if (start == null) {
				throw new IllegalArgumentException("Probation start date is required for probation staff");
			}
			Integer m = request.getProbationMonth();
			boolean fixed = m != null && (m == 1 || m == 3 || m == 6);
			if (m != null && !fixed) {
				throw new IllegalArgumentException("Probation duration must be 1, 3, or 6 months, or custom");
			}
			if (!fixed && request.getProbationEndDate() == null) {
				throw new IllegalArgumentException("Probation end date is required for a custom probation period");
			}
			if (request.getProbationEndDate() != null && request.getProbationEndDate().isBefore(start)) {
				throw new IllegalArgumentException("Probation end date must be on or after probation start date");
			}
		}
	}

	/** Optional on drafts: if provided, must match {@link #BUSINESS_EMPLOYEE_ID}. */
	private void validateOptionalBusinessEmployeeId(String raw) {
		String v = trimToNull(raw);
		if (v == null) {
			return;
		}
		validateBusinessEmployeeIdFormat(v);
	}

	private void validateBusinessEmployeeIdFormat(String v) {
		if (!BUSINESS_EMPLOYEE_ID.matcher(v).matches()) {
			throw new IllegalArgumentException(
					"Employee ID may use letters, digits, dots, underscores, and hyphens (1–100 characters).");
		}
	}

	private EmployeeInfoResponseDto toDto(Employee e) {
		return EmployeeInfoResponseDto.builder()
				.id(e.getId())
				.employeeId(e.getEmployeeId())
				.employeeName(e.getEmployeeName())
				.staffNrcNo(e.getStaffNrcNo())
				.gender(e.getGender())
				.race(e.getRace())
				.religionId(e.getReligion() == null ? null : e.getReligion().getId())
				.religionName(e.getReligion() == null ? null : e.getReligion().getName())
				.dateOfBirth(e.getDateOfBirth())
				.phoneNo(e.getPhoneNo())
				.emailAddress(accountEmailForEmployee(e))
				.maritalStatus(e.getMaritalStatus())
				.departmentId(e.getDepartment() == null ? null : e.getDepartment().getId())
				.departmentName(e.getDepartment() == null ? null : e.getDepartment().getName())
				.positionId(e.getPosition() == null ? null : e.getPosition().getId())
				.positionName(e.getPosition() == null ? null : e.getPosition().getName())
				.nationality(e.getNationality())
				.staffTypeId(e.getStaffType() == null ? null : e.getStaffType().getId())
				.staffTypeName(e.getStaffType() == null ? null : e.getStaffType().getName())
				.dateOfJoining(e.getDateOfJoining())
				.passportNo(passportNo(e))
				.passportExpireDate(passportExpireDate(e))
				.dateOfDemotion(e.getDateOfDemotion())
				.dateOfTitleChange(e.getDateOfTitleChange())
				.dateOfPromotion(e.getDateOfPromotion())
				.dateOfTransfer(e.getDateOfTransfer())
				.probationMonth(e.getProbation() == null ? null : e.getProbation().getProbationMonth())
				.probationStartDate(e.getProbation() == null ? null : e.getProbation().getProbationStartDate())
				.probationEndDate(e.getProbation() == null ? null : e.getProbation().getProbationEndDate())
				.fatherName(fatherName(e))
				.fatherNrcNo(fatherNrcNo(e))
				.fatherOccupation(fatherOccupation(e))
				.spouseName(spouseName(e))
				.spouseNrcNo(spouseNrcNo(e))
				.spouseOccupation(spouseOccupation(e))
				.emergencyPhone(e.getEmergencyContact() == null ? null : e.getEmergencyContact().getEmergencyPhone())
				.emergencyRelation(e.getEmergencyContact() == null ? null : e.getEmergencyContact().getRelation())
				.recordStatus(e.getRecordStatus())
				.build();
	}

	private String accountEmailForEmployee(Employee e) {
		return userRepository.findByEmployee_Id(e.getId()).map(User::getEmail).orElse(null);
	}
}
