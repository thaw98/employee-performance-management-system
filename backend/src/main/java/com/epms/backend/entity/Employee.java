package com.epms.backend.entity;

import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.Hibernate;

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
    "hibernateLazyInitializer", "handler",
    "position",
    "staffType",
    "father",
    "spouse",
    "probation",
    "emergencyContact",
    "createdBy",
    "updatedBy",
    "userAccount",
    "manager"
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

    /** Direct reporting manager (line manager). Falls back to {@link Department#getManagerId()} when null. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_position_id")
    private DepartmentPosition departmentPosition;

    @Column(name = "hire_date")
    private LocalDate dateOfJoining;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", length = 20)
    private EmployeeStatus employmentStatus = EmployeeStatus.ACTIVE;

    @Column(name = "status_effective_from")
    private LocalDate statusEffectiveFrom;

    @Column(name = "employment_status_reason", length = 255)
    private String employmentStatusReason;

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

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "employee_spouse_id")
    private EmployeeSpouse spouse;

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
    public Long getPositionId() {
        if (position == null || !Hibernate.isInitialized(position)) {
            return null;
        }
        return position.getId();
    }

    @Transient
    public String getPositionName() {
        if (position == null || !Hibernate.isInitialized(position)) {
            return null;
        }
        return position.getName();
    }

    @Enumerated(EnumType.STRING)
    @Column(
        name = "marital_status",
        columnDefinition = "ENUM('Single', 'Married')"
    )
    private MaritalStatus maritalStatus;

    @Column(name = "race", length = 100)
    private String race;

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
    private Passport passport;
}
