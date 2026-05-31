package com.epms.backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PipExtendDateRequest {
    private LocalDate extendedEndDate;
}
