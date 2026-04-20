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
@Table(name = "father")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeFather {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "father_name", length = 100)
    private String fatherName;

    @Column(name = "father_nrc_no", length = 100)
    private String fatherNrcNo;

    @Column(name = "father_occupation", length = 100)
    private String fatherOccupation;

    @Transient
    private Employee employee;
}
