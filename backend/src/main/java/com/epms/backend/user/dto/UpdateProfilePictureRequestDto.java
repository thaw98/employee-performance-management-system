package com.epms.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfilePictureRequestDto {
    @NotBlank(message = "Profile picture data cannot be blank")
    private String profilePictureBase64;
}
