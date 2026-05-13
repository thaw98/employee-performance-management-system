package com.epms.backend.user.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String employeeId;
    private String name;
    private String email;
    private String role;
    private Long roleId;
    private String profilePictureUrl;
    private String theme;
    private String wallpaperUrl;
    private String language;
    private String timezone;
    private String timeFormat;
    private String staffNo;
    private String fullName;
    private String departmentName;
    private String positionName;
    private String employmentStatus;
    private String gender;
    private String nrcNo;
    private LocalDate hireDate;
}
