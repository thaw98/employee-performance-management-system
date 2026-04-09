package com.epms.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.employee.EmployeeInfoRequestDto;
import com.epms.backend.dto.employee.EmployeeInfoResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
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
	public EmployeeInfoResponseDto saveDraft(EmployeeInfoRequestDto request, UserPrincipal principal) {
		return save(request, principal, "DRAFT");
	}

	@Transactional
	public EmployeeInfoResponseDto saveCompleted(EmployeeInfoRequestDto request, UserPrincipal principal) {
		validateRequiredBusinessRules(request);
		return save(request, principal, "COMPLETED");
	}

	@Transactional
	public EmployeeInfoResponseDto updateDraft(Long id, EmployeeInfoRequestDto request, UserPrincipal principal) {
		return update(id, request, principal, "DRAFT");
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
		Nationality nationality = nationalityRepository.findById(request.getNationalityId()).orElseThrow(() -> new IllegalArgumentException("Invalid nationality"));

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

		boolean probation = Boolean.TRUE.equals(request.getOnProbation());
		if (probation) {
			LocalDate startDate = request.getProbationStartDate() == null ? request.getDateOfJoining() : request.getProbationStartDate();
			employee.setProbationMonth(3);
			employee.setProbationStartDate(startDate);
			employee.setProbationEndDate(startDate.plusMonths(3));
		} else {
			employee.setProbationMonth(null);
			employee.setProbationStartDate(null);
			employee.setProbationEndDate(null);
		}

		if (isCreate) {
			employee.setCreatedBy(actorId);
		}
		employee.setUpdatedBy(actorId);
	}

	private void validateRequiredBusinessRules(EmployeeInfoRequestDto request) {
		if (request.getDateOfBirth().isAfter(LocalDate.now())) {
			throw new IllegalArgumentException("Date of birth must be in the past");
		}
		if (request.getDateOfJoining().isAfter(LocalDate.now())) {
			throw new IllegalArgumentException("Date of joining cannot be in the future");
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
				.probationMonth(e.getProbationMonth())
				.probationStartDate(e.getProbationStartDate())
				.probationEndDate(e.getProbationEndDate())
				.recordStatus(e.getRecordStatus())
				.build();
	}
}
