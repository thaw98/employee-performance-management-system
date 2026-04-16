package com.epms.backend.entity;

import java.time.LocalDate;

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
@Table(name = "employee_probation")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeProbation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "probation_date")
    private LocalDate probationEndDate;

    @Column(name = "probation_month")
    private Integer probationMonth;

    @Column(name = "probation_start_date")
    private LocalDate probationStartDate;

    @Transient
    private Employee employee;
}
