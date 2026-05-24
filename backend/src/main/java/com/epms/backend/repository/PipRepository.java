package com.epms.backend.repository;

import com.epms.backend.entity.Pip;
import com.epms.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDate;
import java.util.ArrayList;
import jakarta.persistence.criteria.Predicate;

@Repository
public interface PipRepository extends JpaRepository<Pip, Long>, JpaSpecificationExecutor<Pip> {
    @Override
    @EntityGraph(attributePaths = {
            "employee",
            "employee.department",
            "employee.position",
            "manager",
            "manager.department",
            "manager.position",
            "objectives",
            "followUpMeetings"
    })
    Optional<Pip> findById(Long id);

    List<Pip> findByEmployee(Employee employee);

    List<Pip> findByManager(Employee manager);

    List<Pip> findByEmployeeAndStatusIn(Employee employee, List<String> statuses);

    boolean existsByEmployeeAndStatusIn(Employee employee, List<String> statuses);

    List<Pip> findByStatusInAndEndDateLessThanEqual(List<String> statuses, LocalDate endDate);

    long countByStatusIn(List<String> statuses);

    long countByStatusInAndEndDateLessThanEqual(List<String> statuses, LocalDate endDate);

    @Query("""
            SELECT p.status, COUNT(p)
            FROM Pip p
            GROUP BY p.status
            ORDER BY COUNT(p) DESC, p.status ASC
            """)
    List<Object[]> countByStatusGroup();

    default List<Pip> findByFilters(String status, Long departmentId, LocalDate startDate, LocalDate endDate) {
        Specification<Pip> spec = (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                var employeeFetch = root.fetch("employee", jakarta.persistence.criteria.JoinType.LEFT);
                employeeFetch.fetch("department", jakarta.persistence.criteria.JoinType.LEFT);
                employeeFetch.fetch("position", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("manager", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("objectives", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("followUpMeetings", jakarta.persistence.criteria.JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.trim().toUpperCase()));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("employee").get("department").get("id"), departmentId));
            }
            if (startDate != null && endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endDate));
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), startDate));
            } else if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), startDate));
            } else if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), endDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return findAll(spec);
    }
}
