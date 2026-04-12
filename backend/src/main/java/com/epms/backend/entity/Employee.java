package com.epms.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "employees")
public class Employee {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Business-facing employee number as digits-only text (distinct from primary key {@link #id}). */
	@Column(name = "employee_id", length = 100, unique = true)
	private String employeeId;

	@Column(name = "employee_name", length = 50)
	private String employeeName;

	@Column(name = "other_name", length = 100)
	private String otherName;

	@Column(name = "staff_nrc_no", length = 100)
	private String staffNrcNo;

	@Enumerated(EnumType.STRING)
	@Column(name = "gender", columnDefinition = "ENUM('Male','Female')")
	private Gender gender;

	@Column(name = "race", length = 100)
	private String race;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "religion_id")
	private Religion religion;

	@Column(name = "date_of_birth")
	private LocalDate dateOfBirth;

	@Column(name = "birth_place", length = 255)
	private String birthPlace;

	@Column(name = "contact_address", length = 500)
	private String contactAddress;

	@Column(name = "permanent_address", length = 500)
	private String permanentAddress;

	@Column(name = "phone_no", length = 20)
	private String phoneNo;

	@Enumerated(EnumType.STRING)
	@Column(name = "marital_status", columnDefinition = "ENUM('SINGLE','MARRIED')")
	private MaritalStatus maritalStatus;

	@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "employee_spouse_id")
	private EmployeeSpouse spouse;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "department_id")
	private Department department;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "position_id")
	private Position position;

	@Column(name = "nationality", length = 100)
	private String nationality;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "staff_type_id")
	private StaffType staffType;

	@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "employee_probation_id")
	private EmployeeProbation probation;

	@OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
	private EmergencyContact emergencyContact;

	@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "employee_father_id")
	private EmployeeFather father;

	@Column(name = "date_of_joining")
	private LocalDate dateOfJoining;

	@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	@JoinColumn(name = "passport_id")
	private Passport passport;

	@Column(name = "date_of_demotion")
	private LocalDate dateOfDemotion;

	@Column(name = "date_of_title_change")
	private LocalDate dateOfTitleChange;

	@Column(name = "date_of_promotion")
	private LocalDate dateOfPromotion;

	@Column(name = "date_of_transfer")
	private LocalDate dateOfTransfer;

	@Column(name = "record_status", length = 20)
	private String recordStatus;

	/** Data URL or raw base64; mirrors login profile when account exists. */
	@Column(name = "profile_picture_base64", columnDefinition = "LONGTEXT")
	private String profilePictureBase64;

	@Column(name = "created_by")
	private Long createdBy;

	@Column(name = "updated_by")
	private Long updatedBy;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
