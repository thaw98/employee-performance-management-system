package com.epms.backend;

import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.User;
import com.epms.backend.entity.Employee;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.entity.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public DataSeeder(DepartmentRepository departmentRepository, 
                      PositionRepository positionRepository,
                      UserRepository userRepository,
                      EmployeeRepository employeeRepository,
                      RoleRepository roleRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        Department eng = seedDepartmentAndPositions("Engineering", Arrays.asList("Software Engineer", "QA Engineer", "DevOps Engineer"));
        Department mkt = seedDepartmentAndPositions("Marketing", Arrays.asList("Content Writer", "SEO Specialist", "Social Media Manager"));
        Department hr = seedDepartmentAndPositions("HR", Arrays.asList("Recruiter", "HR Manager"));

        Role hrRole = roleRepository.findByNameIgnoreCase("HR").orElseGet(() -> {
            Role r = new Role();
            r.setName("HR");
            return roleRepository.save(r);
        });

        // Other roles
        for (String rname : Arrays.asList("DEPARTMENT_HEAD", "TEAM_HEAD", "EMPLOYEE")) {
            roleRepository.findByNameIgnoreCase(rname).orElseGet(() -> {
                Role r = new Role();
                r.setName(rname);
                return roleRepository.save(r);
            });
        }
        
        // Ensure test user 'hr@gmail.com' exists
        User hrUser = userRepository.findByEmailIgnoreCase("hr@gmail.com").orElseGet(() -> {
            User u = new User();
            u.setEmail("hr@gmail.com");
            u.setPassword("password"); // Will be upgraded to BCrypt on first login by AuthService
            u.setRole(hrRole);
            u.setActive(true);
            return userRepository.save(u);
        });
            
        if (hrUser.getEmployee() == null) {
            Employee emp = new Employee();
            emp.setEmployeeId("EMP11");
            emp.setEmployeeName("HR Manager Admin");
            emp.setDepartment(hr);
            
            Position hrPos = positionRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase("HR Manager"))
                .findFirst()
                .orElse(null);
            emp.setPosition(hrPos);
            
            emp = employeeRepository.save(emp);
            hrUser.setEmployee(emp);
            userRepository.save(hrUser);
        }
    }

    private Department seedDepartmentAndPositions(String deptName, List<String> posNames) {
        Department dept = departmentRepository.findAll().stream()
            .filter(d -> d.getName().equalsIgnoreCase(deptName))
            .findFirst()
            .orElseGet(() -> {
                Department d = new Department();
                d.setName(deptName);
                return departmentRepository.save(d);
            });

        for (String posName : posNames) {
            Position pos = positionRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase(posName))
                .findFirst()
                .orElseGet(() -> {
                    Position p = new Position();
                    p.setName(posName);
                    return p;
                });
            
            if (pos.getDepartment() == null) {
                pos.setDepartment(dept);
                positionRepository.save(pos);
            }
        }
        return dept;
    }
}
