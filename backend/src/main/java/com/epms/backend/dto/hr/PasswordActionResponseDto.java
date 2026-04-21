package com.epms.backend.dto.hr;

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
public class PasswordActionResponseDto {
    private String message;
    private Long employeeId;
    private String email;
    private String actionType;
}
