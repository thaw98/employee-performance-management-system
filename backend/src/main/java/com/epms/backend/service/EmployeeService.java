package com.epms.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.employee.EmployeeDraftRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.EmergencyContact;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.Nationality;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Religion;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.NationalityRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {
	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;
	private final ReligionRepository religionRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;
	private final NationalityRepository nationalityRepository;

	@Transactional
	public EmployeeInfoResponseDto saveDraft(EmployeeDraftRequestDto request, UserPrincipal principal) {
		String employeeId = trimToNull(request.getEmployeeId());
		if (employeeId != null && employeeRepository.existsByEmployeeId(employeeId)) {
			throw new IllegalArgumentException("Employee ID already exists");
		}
		String email = normalizeEmail(request.getEmailAddress());
		if (email != null && isEmailTakenAnywhere(email)) {
			throw new IllegalArgumentException("Email already exists");
		}
		Employee employee = new Employee();
		applyDraft(employee, request, "DRAFT", principal.getId(), true);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto saveCompleted(EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request);
		return save(request, principal, "COMPLETED");
	}

	@Transactional
	public EmployeeInfoResponseDto updateDraft(Long id, EmployeeDraftRequestDto request, UserPrincipal principal) {
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		String employeeId = trimToNull(request.getEmployeeId());
		if (employeeId != null && employeeRepository.existsByEmployeeIdAndIdNot(employeeId, id)) {
			throw new IllegalArgumentException("Employee ID already exists");
		}
		String email = normalizeEmail(request.getEmailAddress());
		if (email != null) {
			if (employeeRepository.existsByEmailAddressIgnoreCaseAndIdNot(email, id)) {
				throw new IllegalArgumentException("Email already exists");
			}
			if (userRepository.existsByEmailIgnoreCase(email)
					&& (employee.getEmailAddress() == null || !employee.getEmailAddress().equalsIgnoreCase(email))) {
				throw new IllegalArgumentException("Email already exists");
			}
		}
		applyDraft(employee, request, "DRAFT", principal.getId(), false);
		return toDto(employeeRepository.save(employee));
	}

	@Transactional
	public EmployeeInfoResponseDto updateCompleted(Long id, EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request);
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
	public boolean isEmployeeIdTaken(String employeeId) {
		return employeeRepository.existsByEmployeeId(employeeId);
	}

	@Transactional(readOnly = true)
	public List<EmployeeInfoResponseDto> autocomplete(String keyword) {
		String query = keyword == null ? "" : keyword.trim();
		return employeeRepository.findTop10ByEmployeeIdContainingIgnoreCaseOrEmployeeNameContainingIgnoreCase(query, query)
				.stream()
				.map(this::toDto)
				.toList();
	}

	@Transactional(readOnly = true)
	public boolean isEmailTakenAnywhere(String email) {
		return employeeRepository.existsByEmailAddressIgnoreCase(email) || userRepository.existsByEmailIgnoreCase(email);
	}

	private EmployeeInfoResponseDto save(EmployeeInfoRequestDto request, UserPrincipal principal, String status) {
		if (employeeRepository.existsByEmployeeId(request.getEmployeeId())) {
			throw new IllegalArgumentException("Employee ID already exists");
		}
		if (isEmailTakenAnywhere(request.getEmailAddress())) {
			throw new IllegalArgumentException("Email already exists");
		}
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

	private static String normalizeEmail(String value) {
		String t = trimToNull(value);
		return t == null ? null : t.toLowerCase();
	}

	private Nationality resolveOrCreateNationality(String rawName) {
		String name = trimToNull(rawName);
		if (name == null) {
			return null;
		}
		return nationalityRepository.findByNameIgnoreCase(name).orElseGet(() -> {
			Nationality n = new Nationality();
			n.setName(name);
			return nationalityRepository.save(n);
		});
	}

	private void applyDraft(Employee employee, EmployeeDraftRequestDto r, String status, Long actorId, boolean isCreate) {
		employee.setEmployeeId(trimToNull(r.getEmployeeId()));
		employee.setEmployeeName(trimToNull(r.getEmployeeName()));
		employee.setOtherName(trimToNull(r.getOtherName()));

		String nrcState = trimToNull(r.getNrcStateCode());
		String nrcTown = trimToNull(r.getNrcTownshipCode());
		String nrcType = trimToNull(r.getNrcType());
		String nrcNum = trimToNull(r.getNrcNumber());
		employee.setNrcStateCode(nrcState);
		employee.setNrcTownshipCode(nrcTown);
		employee.setNrcType(nrcType);
		employee.setNrcNumber(nrcNum);
		if (nrcState != null && nrcTown != null && nrcType != null && nrcNum != null) {
			employee.setNrcFull(nrcState + "/" + nrcTown + "(" + nrcType + ")" + nrcNum);
		} else {
			employee.setNrcFull(null);
		}

		employee.setGender(trimToNull(r.getGender()));
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
		employee.setEmailAddress(normalizeEmail(r.getEmailAddress()));
		employee.setMaritalStatus(trimToNull(r.getMaritalStatus()));
		employee.setSpouseName(trimToNull(r.getSpouseName()));
		employee.setSpouseNrcNo(trimToNull(r.getSpouseNrcNo()));
		employee.setFatherName(trimToNull(r.getFatherName()));
		employee.setFatherNrcNo(trimToNull(r.getFatherNrcNo()));
		employee.setFatherOccupation(trimToNull(r.getFatherOccupation()));
		employee.setSpouseOccupation(trimToNull(r.getSpouseOccupation()));

		if (r.getDepartmentId() != null) {
			Department department = departmentRepository.findById(r.getDepartmentId()).orElseThrow(() -> new IllegalArgumentException("Invalid department"));
			employee.setDepartment(department);
		} else {
			employee.setDepartment(null);
		}
		if (r.getPositionId() != null) {
			Position position = positionRepository.findById(r.getPositionId()).orElseThrow(() -> new IllegalArgumentException("Invalid position"));
			employee.setPosition(position);
		} else {
			employee.setPosition(null);
		}
		if (trimToNull(r.getNationality()) != null) {
			employee.setNationality(resolveOrCreateNationality(r.getNationality()));
		} else {
			employee.setNationality(null);
		}

		employee.setDateOfJoining(r.getDateOfJoining());
		employee.setRecordStatus(status);

		applyProbation(employee, Boolean.TRUE.equals(r.getOnProbation()), r.getProbationStartDate(), r.getDateOfJoining(),
				r.getProbationMonth(), r.getProbationEndDate());

		applyEmergencyContact(employee, r.getEmergencyPhone(), r.getEmergencyRelation());

		if (isCreate) {
			employee.setCreatedBy(actorId);
		}
		employee.setUpdatedBy(actorId);
	}

	private EmployeeInfoResponseDto update(Long id, EmployeeInfoRequestDto request, UserPrincipal principal, String status) {
		Employee employee = employeeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Employee not found"));
		if (employeeRepository.existsByEmployeeIdAndIdNot(request.getEmployeeId(), id)) {
			throw new IllegalArgumentException("Employee ID already exists");
		}
		if (employeeRepository.existsByEmailAddressIgnoreCaseAndIdNot(request.getEmailAddress(), id)) {
			throw new IllegalArgumentException("Email already exists");
		}
		if (userRepository.existsByEmailIgnoreCase(request.getEmailAddress())
				&& !employee.getEmailAddress().equalsIgnoreCase(request.getEmailAddress())) {
			throw new IllegalArgumentException("Email already exists");
		}
		apply(employee, request, status, principal.getId(), false);
		return toDto(employeeRepository.save(employee));
	}

	private void apply(Employee employee, EmployeeInfoRequestDto request, String status, Long actorId, boolean isCreate) {
		Religion religion = religionRepository.findById(request.getReligionId()).orElseThrow(() -> new IllegalArgumentException("Invalid religion"));
		Department department = departmentRepository.findById(request.getDepartmentId()).orElseThrow(() -> new IllegalArgumentException("Invalid department"));
		Position position = positionRepository.findById(request.getPositionId()).orElseThrow(() -> new IllegalArgumentException("Invalid position"));
		Nationality nationality = resolveOrCreateNationality(request.getNationality());

		employee.setEmployeeId(request.getEmployeeId().trim());
		employee.setEmployeeName(request.getEmployeeName().trim());
		employee.setOtherName(request.getOtherName());
		employee.setNrcStateCode(request.getNrcStateCode().trim());
		employee.setNrcTownshipCode(request.getNrcTownshipCode().trim());
		employee.setNrcType(request.getNrcType().trim());
		employee.setNrcNumber(request.getNrcNumber().trim());
		employee.setNrcFull(request.getNrcStateCode().trim() + "/" + request.getNrcTownshipCode().trim()
				+ "(" + request.getNrcType().trim() + ")" + request.getNrcNumber().trim());
		employee.setGender(request.getGender());
		employee.setRace(request.getRace().trim());
		employee.setReligion(religion);
		employee.setDateOfBirth(request.getDateOfBirth());
		employee.setBirthPlace(request.getBirthPlace());
		employee.setContactAddress(request.getContactAddress());
		employee.setPermanentAddress(request.getPermanentAddress());
		employee.setPhoneNo(request.getPhoneNo().trim());
		employee.setEmailAddress(request.getEmailAddress().trim().toLowerCase());
		employee.setMaritalStatus(request.getMaritalStatus());
		employee.setSpouseName(request.getSpouseName());
		employee.setSpouseNrcNo(request.getSpouseNrcNo());
		employee.setFatherName(request.getFatherName());
		employee.setFatherNrcNo(request.getFatherNrcNo());
		employee.setFatherOccupation(request.getFatherOccupation());
		employee.setSpouseOccupation(request.getSpouseOccupation());
		employee.setDepartment(department);
		employee.setPosition(position);
		employee.setNationality(nationality);
		employee.setDateOfJoining(request.getDateOfJoining());
		employee.setRecordStatus(status);

		applyProbation(employee, Boolean.TRUE.equals(request.getOnProbation()), request.getProbationStartDate(), request.getDateOfJoining(),
				request.getProbationMonth(), request.getProbationEndDate());

		applyEmergencyContact(employee, request.getEmergencyPhone(), request.getEmergencyRelation());

		if (isCreate) {
			employee.setCreatedBy(actorId);
		}
		employee.setUpdatedBy(actorId);
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

	private void validateRequiredBusinessRules(EmployeeInfoRequestDto request) {
		if (request.getDateOfBirth().isAfter(LocalDate.now())) {
			throw new IllegalArgumentException("Date of birth must be in the past");
		}
		if (request.getDateOfJoining().isAfter(LocalDate.now())) {
			throw new IllegalArgumentException("Date of joining cannot be in the future");
		}
		if (Boolean.TRUE.equals(request.getOnProbation())) {
			LocalDate start = request.getProbationStartDate() != null ? request.getProbationStartDate() : request.getDateOfJoining();
			if (start == null) {
				throw new IllegalArgumentException("Probation start date is required when on probation");
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

	private EmployeeInfoResponseDto toDto(Employee e) {
		return EmployeeInfoResponseDto.builder()
				.id(e.getId())
				.employeeId(e.getEmployeeId())
				.employeeName(e.getEmployeeName())
				.nrcStateCode(e.getNrcStateCode())
				.nrcTownshipCode(e.getNrcTownshipCode())
				.nrcType(e.getNrcType())
				.nrcNumber(e.getNrcNumber())
				.nrcFull(e.getNrcFull())
				.gender(e.getGender())
				.race(e.getRace())
				.religionId(e.getReligion() == null ? null : e.getReligion().getId())
				.religionName(e.getReligion() == null ? null : e.getReligion().getName())
				.dateOfBirth(e.getDateOfBirth())
				.phoneNo(e.getPhoneNo())
				.emailAddress(e.getEmailAddress())
				.departmentId(e.getDepartment() == null ? null : e.getDepartment().getId())
				.departmentName(e.getDepartment() == null ? null : e.getDepartment().getName())
				.positionId(e.getPosition() == null ? null : e.getPosition().getId())
				.positionName(e.getPosition() == null ? null : e.getPosition().getName())
				.nationalityId(e.getNationality() == null ? null : e.getNationality().getId())
				.nationalityName(e.getNationality() == null ? null : e.getNationality().getName())
				.dateOfJoining(e.getDateOfJoining())
				.probationMonth(e.getProbation() == null ? null : e.getProbation().getProbationMonth())
				.probationStartDate(e.getProbation() == null ? null : e.getProbation().getProbationStartDate())
				.probationEndDate(e.getProbation() == null ? null : e.getProbation().getProbationEndDate())
				.fatherName(e.getFatherName())
				.fatherNrcNo(e.getFatherNrcNo())
				.spouseName(e.getSpouseName())
				.spouseNrcNo(e.getSpouseNrcNo())
				.emergencyPhone(e.getEmergencyContact() == null ? null : e.getEmergencyContact().getEmergencyPhone())
				.emergencyRelation(e.getEmergencyContact() == null ? null : e.getEmergencyContact().getRelation())
				.recordStatus(e.getRecordStatus())
				.build();
	}
}
