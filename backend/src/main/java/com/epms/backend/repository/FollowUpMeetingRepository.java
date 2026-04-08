package com.epms.backend.repository;

import com.epms.backend.entity.FollowUpMeeting;
import com.epms.backend.entity.Pip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpMeetingRepository extends JpaRepository<FollowUpMeeting, Long> {
    List<FollowUpMeeting> findByPip(Pip pip);
}
