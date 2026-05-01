package com.epms.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kpi_templates")
@Getter
@Setter
@NoArgsConstructor
public class KpiTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_name", nullable = false)
    private String name;

    @Column(name = "template_type", nullable = false)
    private String type; // INDIVIDUAL, POSITION, DEPARTMENT

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "position_id")
    private Long positionId;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KpiTemplateItem> items = new ArrayList<>();

    public void addItem(KpiTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }
}
