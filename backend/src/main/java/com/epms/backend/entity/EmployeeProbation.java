package com.epms.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "employee_probation")
public class EmployeeProbation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "employee_id", unique = true, nullable = false)
	private Employee employee;

	@Column(name = "probation_month")
	private Integer probationMonth;

	@Column(name = "probation_start_date")
	private LocalDate probationStartDate;

	@Column(name = "probation_end_date")
	private LocalDate probationEndDate;
}
