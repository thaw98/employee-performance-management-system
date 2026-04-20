package com.epms.backend.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeSpouse {

    private Employee employee;
    private String spouseName;
    private String spouseNrcNo;
    private String spouseOccupation;
}
