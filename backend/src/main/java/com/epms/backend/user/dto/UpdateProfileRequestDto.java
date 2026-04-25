package com.epms.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDto {
    @Email(message = "Email must be valid")
    private String email;
    
    private String name;
    
    private String theme;
}
