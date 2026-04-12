package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "employee_spouse")
public class EmployeeSpouse {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(mappedBy = "spouse", fetch = FetchType.LAZY)
	private Employee employee;

	@Column(name = "spouse_name", length = 100)
	private String spouseName;

	@Column(name = "spouse_nrc_no", length = 100)
	private String spouseNrcNo;

	@Column(name = "spouse_occupation", length = 100)
	private String spouseOccupation;
}
