package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "department_has_position")
@Getter
@Setter
@NoArgsConstructor
public class DepartmentHasPosition {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "department_id", nullable = false)
	private Department department;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "position_id", nullable = false)
	private Position position;

	@Column(name = "status", nullable = false, length = 20)
	private String status;

	@Column(name = "created_by")
	private Long createdBy;

	@Column(name = "created_on")
	private Instant createdOn;

	@Column(name = "updated_by")
	private Long updatedBy;

	@Column(name = "updated_on")
	private Instant updatedOn;
}