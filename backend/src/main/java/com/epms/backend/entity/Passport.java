package com.epms.backend.entity;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Passport {

    private String passportNo;
    private LocalDate passportExpireDate;
}
