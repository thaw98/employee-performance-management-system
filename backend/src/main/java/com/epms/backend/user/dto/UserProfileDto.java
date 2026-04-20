package com.epms.backend.user.dto;

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
    private String profilePictureUrl;
}
