package com.epms.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

	@Column(name = "employee_id", unique = true, length = 50)
	private String employeeId;

	@Column(name = "employee_name", length = 50)
	private String employeeName;

	@Column(name = "other_name", length = 100)
	private String otherName;

	@Column(name = "nrc_state_code", length = 10)
	private String nrcStateCode;

	@Column(name = "nrc_township_code", length = 50)
	private String nrcTownshipCode;

	@Column(name = "nrc_type", length = 10)
	private String nrcType;

	@Column(name = "nrc_number", length = 20)
	private String nrcNumber;

	@Column(name = "nrc_full", length = 100)
	private String nrcFull;

	@Column(name = "gender", length = 20)
	private String gender;

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

	@Column(name = "email_address", unique = true, length = 255)
	private String emailAddress;

	@Column(name = "marital_status", length = 50)
	private String maritalStatus;

	@Column(name = "spouse_name", length = 100)
	private String spouseName;

	@Column(name = "spouse_nrc_no", length = 100)
	private String spouseNrcNo;

	@Column(name = "father_name", length = 100)
	private String fatherName;

	@Column(name = "father_nrc_no", length = 100)
	private String fatherNrcNo;

	@Column(name = "father_occupation", length = 100)
	private String fatherOccupation;

	@Column(name = "spouse_occupation", length = 100)
	private String spouseOccupation;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "department_id")
	private Department department;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "position_id")
	private Position position;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "nationality_id")
	private Nationality nationality;

	@OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
	private EmployeeProbation probation;

	@OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
	private EmergencyContact emergencyContact;

	@Column(name = "date_of_joining")
	private LocalDate dateOfJoining;

	@Column(name = "record_status", length = 20)
	private String recordStatus;

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
