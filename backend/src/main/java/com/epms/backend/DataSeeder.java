package com.epms.backend;

import com.epms.backend.entity.Criteria;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.User;
import com.epms.backend.entity.Employee;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.entity.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Order(5)
@ConditionalOnProperty(name = "epms.autoseed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final CriteriaRepository criteriaRepository;
    private final StaffTypeRepository staffTypeRepository;

    public DataSeeder(DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            RoleRepository roleRepository,
            CriteriaRepository criteriaRepository,
            StaffTypeRepository staffTypeRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.criteriaRepository = criteriaRepository;
        this.staffTypeRepository = staffTypeRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        Role hrRole = roleRepository.findByNameIgnoreCase("HR").orElseGet(() -> {
            Role r = new Role();
            r.setId(1L);
            r.setName("HR");
            return roleRepository.save(r);
        });

        // Other roles
        long fallbackId = 2L;
        for (String rname : Arrays.asList("Department Head", "Team Head", "Employee")) {
            final long fId = fallbackId++;
            roleRepository.findByNameIgnoreCase(rname).orElseGet(() -> {
                Role r = new Role();
                r.setId(fId);
                r.setName(rname);
                return roleRepository.save(r);
            });
        }

        Role employeePositionRole = roleRepository.findByNameIgnoreCase("Employee").orElse(null);
        seedDepartmentAndPositions("Engineering",
                Arrays.asList("Software Engineer", "QA Engineer", "DevOps Engineer"), employeePositionRole, hrRole);
        seedDepartmentAndPositions("Marketing",
                Arrays.asList("Content Writer", "SEO Specialist", "Social Media Manager"), employeePositionRole, hrRole);
        Department hr = seedDepartmentAndPositions("HR", Arrays.asList("Recruiter", "HR Manager"), employeePositionRole, hrRole);

        // Ensure test user 'hr@gmail.com' exists
        User hrUser = userRepository.findByEmployee_EmailIgnoreCase("hr@gmail.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("hr@gmail.com");
            u.setPassword("password");
            u.setRole(hrRole);
            u.setActive(true);
            return userRepository.save(u);
        });

        if (hrUser.getEmployee() == null) {
            Employee emp = new Employee();
            emp.setEmployeeName("HR Manager Admin");
            emp.setDepartment(hr);

            Position hrPos = positionRepository.findAll().stream()
                    .filter(p -> p.getName().equalsIgnoreCase("HR Manager"))
                    .findFirst()
                    .orElse(null);
            emp.setPosition(hrPos);
            staffTypeRepository.findById(StaffTypes.PERMANENT).ifPresent(emp::setStaffType);


            emp = employeeRepository.save(emp);
            hrUser.setEmployee(emp);
            userRepository.save(hrUser);
        }

        // --- Seed Criteria ---
        if (criteriaRepository.count() == 0) {
            seedCriteria("Job Knowledge", "Depth and breadth of knowledge required for the current position.");
            seedCriteria("Communication Skills", "Ability to convey ideas and listen actively to others.");
            seedCriteria("Teamwork", "Cooperation and contribution towards team goals.");
            seedCriteria("Problem Solving", "Analyzes issues and develops effective, creative solutions.");
            seedCriteria("Dependability", "Reliability in completing tasks and following through on commitments.");
            seedCriteria("Initiative", "Proactively identifies opportunities and takes appropriate action.");
        }

    }

    private void seedCriteria(String name, String description) {
        Criteria c = new Criteria();
        c.setName(name);
        c.setDescription(description);
        criteriaRepository.save(c);
    }

    private Department seedDepartmentAndPositions(String deptName, List<String> posNames, Role defaultPositionRole,
            Role hrManagerPositionRole) {
        Department dept = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equalsIgnoreCase(deptName))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setCode(deptName.toUpperCase().replaceAll("\\s+", "_").substring(0, Math.min(deptName.length(), 10)));
                    d.setName(deptName);
                    d.setStatus("Active");
                    return departmentRepository.save(d);
                });

        for (String posName : posNames) {
            final String pName = posName;
            Position pos = positionRepository.findAll().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(pName))
                    .findFirst()
                    .orElseGet(() -> {
                        Position p = new Position();
                        p.setName(pName);
                        p.setStatus("ACTIVE");
                        Role forPos = "HR Manager".equalsIgnoreCase(pName) && hrManagerPositionRole != null
                                ? hrManagerPositionRole
                                : defaultPositionRole;
                        if (forPos != null) {
                            p.setRole(forPos);
                        }
                        return p;
                    });

            if (pos.getStatus() == null || pos.getStatus().isBlank()) {
                pos.setStatus("ACTIVE");
            }
            if (pos.getRole() == null) {
                Role forPos = "HR Manager".equalsIgnoreCase(pos.getName()) && hrManagerPositionRole != null
                        ? hrManagerPositionRole
                        : defaultPositionRole;
                if (forPos != null) {
                    pos.setRole(forPos);
                }
            }
            positionRepository.save(pos);
        }
        return dept;
    }
}
