package com.epms.backend.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.Department;
import com.epms.backend.entity.Nationality;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Religion;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.NationalityRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.ReligionRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(4)
@RequiredArgsConstructor
public class MasterDataInitializer implements CommandLineRunner {
	private final ReligionRepository religionRepository;
	private final NationalityRepository nationalityRepository;
	private final DepartmentRepository departmentRepository;
	private final PositionRepository positionRepository;

	@Override
	public void run(String... args) {
		seedReligions();
		seedNationalities();
		seedDepartments();
		seedPositions();
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

	private void seedNationalities() {
		if (nationalityRepository.count() > 0) {
			return;
		}
		List.of("Burmese", "Thai", "Indian", "Chinese").forEach(name -> {
			Nationality nationality = new Nationality();
			nationality.setName(name);
			nationalityRepository.save(nationality);
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
