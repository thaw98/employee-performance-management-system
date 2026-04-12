package com.epms.backend.config;

import com.epms.backend.entity.*;
import com.epms.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@Order(3)
@ConditionalOnProperty(name = "epms.autoseed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class PipDataInitializer implements CommandLineRunner {

    private final PipRepository pipRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final TrainingRecordRepository trainingRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (pipRepository.count() > 0) {
            return; // Prevent duplicate sample data
        }

        // 1. Ensure sample users exist - find roles by name for safety
        Role teamHeadRole = roleRepository.findByNameIgnoreCase("Team Head")
                .orElseThrow(() -> new IllegalStateException("Role 'Team Head' missing"));
        Role employeeRole = roleRepository.findByNameIgnoreCase("Employee")
                .orElseThrow(() -> new IllegalStateException("Role 'Employee' missing"));

        User manager = createOrUpdateUser("manager@gmail.com", "Manager User", teamHeadRole);
        User employee1 = createOrUpdateUser("employee1@gmail.com", "Employee One", employeeRole);
        User employee2 = createOrUpdateUser("employee2@gmail.com", "Employee Two", employeeRole);

        // 2. Sample Training Records
        if (trainingRecordRepository.count() == 0) {
            createTraining(employee1, "Advanced React Workshop", LocalDate.now().minusMonths(2), "Completed");
            createTraining(employee1, "Communication Skills", LocalDate.now().minusMonths(1), "Completed");
            createTraining(employee2, "Java Performance Tuning", LocalDate.now().minusMonths(3), "Completed");
        }

        // 3. Sample PIPs
        // Active PIP for Employee 1
        Pip pip1 = new Pip();
        pip1.setEmployee(employee1);
        pip1.setManager(manager);
        pip1.setStartDate(LocalDate.now().minusDays(15));
        pip1.setEndDate(LocalDate.now().plusDays(45));
        pip1.setStatus("ACTIVE");

        PipObjective obj1a = new PipObjective();
        obj1a.setDescription("Improve project delivery turnaround time by 20%");
        obj1a.setPip(pip1);
        obj1a.setProgressPercentage(45);

        PipObjective obj1b = new PipObjective();
        obj1b.setDescription("Complete 3 peer code reviews per week");
        obj1b.setPip(pip1);
        obj1b.setProgressPercentage(60);

        pip1.setObjectives(Arrays.asList(obj1a, obj1b));

        FollowUpMeeting meeting1 = new FollowUpMeeting();
        meeting1.setPip(pip1);
        meeting1.setMeetingTime(LocalDateTime.now().plusDays(5));
        meeting1.setStatus("SCHEDULED");
        pip1.setFollowUpMeetings(Arrays.asList(meeting1));

        pipRepository.save(pip1);

        // Closed PIP for Employee 2
        Pip pip2 = new Pip();
        pip2.setEmployee(employee2);
        pip2.setManager(manager);
        pip2.setStartDate(LocalDate.now().minusMonths(3));
        pip2.setEndDate(LocalDate.now().minusMonths(1));
        pip2.setStatus("CLOSED");
        pip2.setFinalOutcome("SUCCESSFUL");
        pip2.setClosingRemarks("Employee showed significant improvement in coding standards and teamwork.");

        PipObjective obj2 = new PipObjective();
        obj2.setDescription("Adopt new internal coding standards");
        obj2.setPip(pip2);
        obj2.setProgressPercentage(100);
        pip2.setObjectives(Arrays.asList(obj2));

        pipRepository.save(pip2);
    }

    private static String seedBusinessEmployeeId(String email) {
        String local = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        return "PIP-" + local.replace('.', '-');
    }

    private User createOrUpdateUser(String email, String displayName, Role role) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        Employee employee = user.getEmployee();
        if (employee == null) {
            employee = new Employee();
            employee.setEmployeeName(displayName);
            employee.setEmployeeId(seedBusinessEmployeeId(email));
            employee.setRecordStatus("COMPLETED");
            employee = employeeRepository.save(employee);
            user.setEmployee(employee);
        } else {
            employee.setEmployeeName(displayName);
            if (employee.getEmployeeId() == null || employee.getEmployeeId().isBlank()) {
                employee.setEmployeeId(seedBusinessEmployeeId(email));
            }
            employeeRepository.save(employee);
        }
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("12345678"));
        user.setRole(role);
        user.setActive(true);
        user.setMustChangePassword(false);
        return userRepository.save(user);
    }

    private void createTraining(User employee, String name, LocalDate date, String status) {
        TrainingRecord tr = new TrainingRecord();
        tr.setEmployee(employee);
        tr.setTrainingName(name);
        tr.setCompletionDate(date);
        tr.setStatus(status);
        trainingRecordRepository.save(tr);
    }
}
