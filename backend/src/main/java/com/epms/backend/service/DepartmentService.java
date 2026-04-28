package com.epms.backend.service;

import java.util.List;

import com.epms.backend.dto.department.CreateDepartmentRequest;
import com.epms.backend.dto.department.DepartmentDto;
import com.epms.backend.dto.department.ManagerOptionDto;
import com.epms.backend.dto.department.UpdateDepartmentRequest;

public interface DepartmentService {
    List<DepartmentDto> getAllDepartments();
    DepartmentDto getDepartmentById(Long id);
    DepartmentDto createDepartment(CreateDepartmentRequest request);
    DepartmentDto updateDepartment(Long id, UpdateDepartmentRequest request);
    List<ManagerOptionDto> getAllManagers(Long departmentId);
    void deleteDepartment(Long id);
}
