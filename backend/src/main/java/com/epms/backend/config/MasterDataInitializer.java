package com.epms.backend.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Religion;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;
import com.epms.backend.repository.StaffTypeRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(4)
@RequiredArgsConstructor
public class MasterDataInitializer implements CommandLineRunner {
	private final ReligionRepository religionRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;
	private final StaffTypeRepository staffTypeRepository;

	@Override
	public void run(String... args) {
		seedStaffTypes();
		seedReligions();
		seedDepartments();
		seedPositions();
	}

	private void seedStaffTypes() {
		if (staffTypeRepository.count() > 0) {
			return;
		}
		StaffType permanent = new StaffType();
		permanent.setId(StaffTypes.PERMANENT);
		permanent.setName("Permanent");
		staffTypeRepository.save(permanent);
		StaffType probation = new StaffType();
		probation.setId(StaffTypes.PROBATION);
		probation.setName("Probation");
		staffTypeRepository.save(probation);
	}

	private void seedReligions() {
		if (religionRepository.count() > 0) {
			return;
		}
		List.of("Buddhist", "Christian", "Muslim", "Hindu").forEach(name -> {
			Religion religion = new Religion();
			religion.setName(name);
			religionRepository.save(religion);
		});
	}

	private void seedDepartments() {
		if (departmentRepository.count() > 0) {
			return;
		}
		List.of("HR", "Engineering", "Finance", "Operations").forEach(name -> {
			Department department = new Department();
			department.setName(name);
			departmentRepository.save(department);
		});
	}

	private void seedPositions() {
		if (positionRepository.count() > 0) {
			return;
		}
		List.of("Executive Director", "Software Engineer", "Accountant", "Team Lead").forEach(name -> {
			Position position = new Position();
			position.setName(name);
			positionRepository.save(position);
		});
	}
}
