package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employee")
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties({
    "manager",
    "parentDepartment",
    "position",
    "staffType",
    "father",
    "probation",
    "emergencyContact",
    "createdBy",
    "updatedBy",
    "userAccount"
})

public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long id;

    @Column(name = "staff_no", unique = true, length = 50)
    private String employeeId;

    @Column(name = "full_name", nullable = false, length = 50)
    private String employeeName;

    @Column(name = "email", length = 255)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    /** Mirrors the selected department for compatibility with legacy schemas. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(name = "hire_date")
    private LocalDate dateOfJoining;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", length = 20)
    private EmployeeStatus employmentStatus = EmployeeStatus.ACTIVE;

    @Column(name = "staff_nrc_no", length = 100)
    private String staffNrcNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_type_id")
    private StaffType staffType;

    @Column(name = "profile_picture_url", length = 2048)
    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(
        name = "religion",
        columnDefinition = "ENUM('Buddhist', 'Christian', 'Muslim', 'Hindu')"
    )
    private EmployeeReligion religion;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "father_id")
    private EmployeeFather father;

    @OneToOne(mappedBy = "employee", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private EmployeeProbation probation;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "emergency_contact_id")
    private EmergencyContact emergencyContact;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "updated_date")
    private Instant updatedDate;

    @Transient
    private String otherName;

    @Transient
    private String race;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Transient
    private String birthPlace;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Transient
    private String permanentAddress;

    @Column(name = "phone_number", length = 20)
    private String phoneNo;

    @Transient
    private MaritalStatus maritalStatus;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Transient
    private LocalDate dateOfDemotion;

    @Transient
    private LocalDate dateOfTitleChange;

    @Transient
    private LocalDate dateOfPromotion;

    @Transient
    private LocalDate dateOfTransfer;

    @Transient
    private String recordStatus;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @OneToOne(mappedBy = "employee", fetch = FetchType.LAZY)
    private User userAccount;

    @Transient
    private EmployeeSpouse spouse;

    @Transient
    private Passport passport;
}
