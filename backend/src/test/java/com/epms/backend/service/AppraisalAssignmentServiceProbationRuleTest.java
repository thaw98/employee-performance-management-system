package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.AppraisalAssignmentRepository;

@ExtendWith(MockitoExtension.class)
class AppraisalAssignmentServiceProbationRuleTest {

    @Mock
    private AppraisalAssignmentRepository appraisalAssignmentRepository;
    @Mock
    private AuditService auditService;

    private AppraisalAssignmentService appraisalAssignmentService;

    @BeforeEach
    void setUp() {
        appraisalAssignmentService = new AppraisalAssignmentService(appraisalAssignmentRepository, auditService);
    }

    @Test
    void getAllAssignments_excludesProbationEmployees() {
        AppraisalAssignment permanentAssignment = newAssignment(1L, StaffTypes.PERMANENT);
        AppraisalAssignment probationAssignment = newAssignment(2L, StaffTypes.PROBATION);

        when(appraisalAssignmentRepository.findAll()).thenReturn(List.of(permanentAssignment, probationAssignment));

        List<AppraisalAssignment> result = appraisalAssignmentService.getAllAssignments();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getById_throwsNotFoundForProbationEmployee() {
        AppraisalAssignment probationAssignment = newAssignment(2L, StaffTypes.PROBATION);
        when(appraisalAssignmentRepository.findById(eq(2L))).thenReturn(Optional.of(probationAssignment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> appraisalAssignmentService.getById(2L));
        assertEquals("Appraisal not found", ex.getMessage());
    }

    private static AppraisalAssignment newAssignment(Long id, long staffTypeId) {
        AppraisalAssignment assignment = new AppraisalAssignment();
        assignment.setId(id);

        Employee employee = new Employee();
        StaffType staffType = new StaffType();
        staffType.setId(staffTypeId);
        employee.setStaffType(staffType);
        assignment.setEmployee(employee);
        return assignment;
    }
}
