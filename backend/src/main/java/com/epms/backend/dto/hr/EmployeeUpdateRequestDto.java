package com.epms.backend.dto.hr;

import java.time.LocalDate;
import com.epms.backend.entity.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmployeeUpdateRequestDto {
    private String employeeId; // staffNo
    
    @NotBlank
    private String employeeName;
    
    @NotBlank
    @Email
    private String email;
    
    private String staffNrcNo;
    private Gender gender;
    private String religion;
    private String fatherName;
    private String fatherNrcNo;
    private String fatherOccupation;
    private String emergencyPhone;
    private String emergencyRelation;
    
    @NotNull
    private Long departmentId;
    
    @NotNull
    private Long departmentPositionId;
    
    private Long managerId;
    
    @NotNull
    private LocalDate dateOfJoining;
    
    @NotNull
    private Long staffTypeId;
    
    private String profilePictureUrl;
}
