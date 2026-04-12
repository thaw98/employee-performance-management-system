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
@Table(name = "employee_father")
public class EmployeeFather {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(mappedBy = "father", fetch = FetchType.LAZY)
	private Employee employee;

	@Column(name = "father_name", length = 100)
	private String fatherName;

	@Column(name = "father_nrc_no", length = 100)
	private String fatherNrcNo;

	@Column(name = "father_occupation", length = 100)
	private String fatherOccupation;
}
