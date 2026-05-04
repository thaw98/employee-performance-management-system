package com.epms.backend.dto.hr;

import java.time.LocalDate;
import com.epms.backend.entity.Gender;
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
public class EmployeeDetailResponseDto {
    private Long id;
    private String employeeId; // staffNo
    private String employeeName;
    private String email;
    private String staffNrcNo;
    private Gender gender;
    private String religion;
    private LocalDate dateOfBirth;
    private String phoneNo;
    private String address;
    private String race;
    private String status;
    private Long departmentId;
    private String departmentName;
    private Long departmentPositionId;
    private Long positionId;
    private String positionName;
    private Long managerId;
    private String managerName;
    private Long staffTypeId;
    private String staffTypeName;
    private LocalDate dateOfJoining;
    private LocalDate probationStartDate;
    private Integer probationDays;
    private LocalDate probationEndDate;
    private String fatherName;
    private String fatherNrcNo;
    private String fatherOccupation;
    private String emergencyPhone;
    private String emergencyRelation;
    private String profilePictureUrl;

    /** {@code Single} or {@code Married}, or null if unset. */
    private String maritalStatus;
    private Long spouseId;
    private String spouseName;
    private String spouseNrc;
}
