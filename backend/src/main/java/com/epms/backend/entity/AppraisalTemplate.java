package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "appraisal_templates")
@Getter
@Setter
@NoArgsConstructor
public class AppraisalTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "assessment_date")
    private LocalDate assessmentDate;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @ManyToMany
    @JoinTable(
        name = "template_categories",
        joinColumns = @JoinColumn(name = "template_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<AppraisalCategory> categories;

    @ManyToMany
    @JoinTable(
        name = "template_department_positions",
        joinColumns = @JoinColumn(name = "template_id"),
        inverseJoinColumns = @JoinColumn(name = "department_position_id")
    )
    private List<DepartmentPosition> targetDepartmentPositions;

    @Column(name = "max_rating")
    private Integer maxRating = 5;

    @Column(name = "created_at")
    private LocalDate createdAt = LocalDate.now();
}
