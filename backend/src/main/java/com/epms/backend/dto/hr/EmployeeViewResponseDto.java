package com.epms.backend.dto.hr;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeViewResponseDto {
    private Long employeeId;
    private String staffNo;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String status;
    private String profilePictureUrl;
    private String staffNrcNumber;
    private String address;
    private String nationality;
    private String employmentStatus;
    private DepartmentInfo department;
    private PositionInfo position;
    private StaffTypeInfo staffType;
    private EmergencyContactInfo emergencyContact;
    private FatherInfo father;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentInfo {
        private Long departmentId;
        private String departmentName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PositionInfo {
        private Long positionId;
        private String positionName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StaffTypeInfo {
        private Long staffTypeId;
        private String staffTypeName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmergencyContactInfo {
        private String employeePhone;
        private String relation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FatherInfo {
        private String fatherName;
        private String fatherNrcNo;
        private String fatherOccupation;
    }
}
