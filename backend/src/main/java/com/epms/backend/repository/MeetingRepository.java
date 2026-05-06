package com.epms.backend.repository;

import com.epms.backend.entity.Meeting;
import com.epms.backend.entity.MeetingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long>, JpaSpecificationExecutor<Meeting> {
    Page<Meeting> findByManagerId(Long managerId, Pageable pageable);
    Page<Meeting> findByManagerIdAndStatusIn(Long managerId, List<MeetingStatus> statuses, Pageable pageable);
    
    Page<Meeting> findByEmployeeId(Long employeeId, Pageable pageable);
    Page<Meeting> findByEmployeeIdAndStatusIn(Long employeeId, List<MeetingStatus> statuses, Pageable pageable);
    List<Meeting> findByStatusIn(List<MeetingStatus> statuses);
}
