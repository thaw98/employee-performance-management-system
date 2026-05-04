package com.epms.backend.service;

import org.springframework.stereotype.Component;

import com.epms.backend.entity.Employee;
import com.epms.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

/**
 * Resolves an employee's reporting manager: {@code employee.manager_id} when set,
 * otherwise {@code department.manager_id}.
 */
@Component
@RequiredArgsConstructor
public class ReportingManagerResolver {

    private final EmployeeRepository employeeRepository;

    public Employee resolve(Employee employee) {
        if (employee == null) {
            return null;
        }
        Employee direct = employee.getManager();
        if (direct != null) {
            if (employee.getId() != null && employee.getId().equals(direct.getId())) {
                return null;
            }
            return direct;
        }
        if (employee.getDepartment() == null || employee.getDepartment().getManagerId() == null) {
            return null;
        }
        Long departmentManagerId = employee.getDepartment().getManagerId();
        if (employee.getId() != null && employee.getId().equals(departmentManagerId)) {
            return null;
        }
        return employeeRepository.findById(departmentManagerId).orElse(null);
    }
}
