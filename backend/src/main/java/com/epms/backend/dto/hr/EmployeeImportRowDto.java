package com.epms.backend.dto.hr;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeImportRowDto {
    private String staffNo;
    private String fullName;
    private String email;
    private String department;
    private String position;
    private String phoneNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String staffType;
    private String address;
    private String race;
    private String employmentStatus;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
    private String fatherName;
    private String fatherPhone;
    private String fatherAddress;
    private String fatherNationality;
    private String maritalStatus;
    private String spouseName;
    private String spouseNrc;
    private String profilePictureUrl;
}
