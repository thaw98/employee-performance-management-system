package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employee_spouse")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeSpouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "spouse_id")
    private Long spouseId;

    @Column(name = "spouse_name", length = 100)
    private String spouseName;

    @Column(name = "spouse_nrc", length = 100)
    private String spouseNrc;

    @Transient
    private Employee employee;
}
