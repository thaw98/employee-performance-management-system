package com.epms.backend.service;

import com.epms.backend.dto.*;
import com.epms.backend.entity.*;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.MeetingNoteRepository;
import com.epms.backend.repository.MeetingRepository;
import com.epms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingNoteRepository meetingNoteRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public MeetingResponse scheduleMeeting(Long managerId, MeetingRequest request) {
        if (request.scheduledTime().isBefore(java.time.Instant.now())) {
            throw new RuntimeException("Cannot schedule a meeting in the past");
        }
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        boolean isSameDepartment = manager.getDepartment() != null && employee.getDepartment() != null &&
                manager.getDepartment().getId().equals(employee.getDepartment().getId());
        boolean isDirectSubordinate = employee.getManager() != null
                && employee.getManager().getId().equals(manager.getId());

        if (!isSameDepartment && !isDirectSubordinate) {
            throw new RuntimeException(
                    "Can only schedule meetings with employees from your department or your direct subordinates");
        }

        if (manager.getPosition() == null || employee.getPosition() == null ||
                manager.getPosition().getLevelCode() == null || employee.getPosition().getLevelCode() == null) {
            throw new RuntimeException("Both participants must have an assigned position and level code");
        }

        if (manager.getPosition().getLevelCode().getId() >= employee.getPosition().getLevelCode().getId()) {
            throw new RuntimeException(
                    "Can only schedule meetings with employees whose level code is lower than yours");
        }

        Meeting meeting = new Meeting();
        meeting.setManager(manager);
        meeting.setEmployee(employee);
        meeting.setTitle(request.title());
        meeting.setDescription(request.description());
        meeting.setScheduledTime(request.scheduledTime());
        meeting.setDurationMinutes(request.durationMinutes());
        meeting.setStatus(MeetingStatus.PENDING);

        meeting = meetingRepository.save(meeting);

        notificationService.send(
                employee.getUserAccount(),
                "New Meeting Scheduled",
                "Manager " + manager.getEmployeeName() + " scheduled a meeting: " + meeting.getTitle(),
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional(readOnly = true)
    public Page<MeetingResponse> getManagerMeetings(
            Long managerId, 
            List<MeetingStatus> statuses, 
            String searchName,
            Long departmentId,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {
        
        Specification<Meeting> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("manager").get("id"), managerId));
            
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (searchName != null && !searchName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("employee").get("employeeName")), "%" + searchName.toLowerCase() + "%"));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("employee").get("department").get("id"), departmentId));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("scheduledTime"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("scheduledTime"), toDate));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return meetingRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<MeetingResponse> getEmployeeMeetings(
            Long employeeId, 
            List<MeetingStatus> statuses,
            String searchName,
            Long departmentId,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {
        
        Specification<Meeting> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (searchName != null && !searchName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("manager").get("employeeName")), "%" + searchName.toLowerCase() + "%"));
            }
            if (departmentId != null) {
                predicates.add(cb.equal(root.get("employee").get("department").get("id"), departmentId));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("scheduledTime"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("scheduledTime"), toDate));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return meetingRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeetingDetails(Long id, Long userId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        verifyParticipant(meeting, userId);
        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse acceptMeeting(Long id, Long employeeUserId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        if (!meeting.getEmployee().getUserAccount().getId().equals(employeeUserId)) {
            throw new RuntimeException("Only the invited employee can accept the meeting");
        }

        meeting.setStatus(MeetingStatus.ACCEPTED);
        meeting.setRescheduleReason(null);
        meeting.setProposedTime(null);
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getManager().getUserAccount(),
                "Meeting Accepted",
                meeting.getEmployee().getEmployeeName() + " accepted the meeting: " + meeting.getTitle(),
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse requestReschedule(Long id, Long userId, MeetingRescheduleRequest request) {
        // Allow a small buffer (5 mins) for network latency/time sync
        if (request.proposedTime() == null) {
            throw new RuntimeException("Proposed time is required");
        }
        if (request.proposedTime().isBefore(java.time.Instant.now().minusSeconds(300))) {
            throw new RuntimeException("Cannot propose a reschedule time in the past");
        }
        
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found with ID: " + id));

        if (meeting.getStatus() == MeetingStatus.COMPLETED || meeting.getStatus() == MeetingStatus.CANCELLED) {
            throw new RuntimeException("Cannot reschedule a " + meeting.getStatus().toString().toLowerCase() + " meeting");
        }

        if (meeting.getManager().getUserAccount() == null || meeting.getEmployee().getUserAccount() == null) {
            throw new RuntimeException("One of the participants does not have a linked user account");
        }

        boolean isManager = meeting.getManager().getUserAccount().getId().equals(userId);
        boolean isEmployee = meeting.getEmployee().getUserAccount().getId().equals(userId);

        if (!isManager && !isEmployee) {
            throw new RuntimeException("Unauthorized: You are not a participant of this meeting");
        }

        if (isEmployee) {
            meeting.setStatus(MeetingStatus.RESCHEDULE_REQUESTED);
            notificationService.send(
                    meeting.getManager().getUserAccount(),
                    "Meeting Reschedule Requested",
                    meeting.getEmployee().getEmployeeName() + " requested to reschedule: " + meeting.getTitle(),
                    "MEETING");
        } else {
            meeting.setStatus(MeetingStatus.RESCHEDULE_MGR);
            notificationService.send(
                    meeting.getEmployee().getUserAccount(),
                    "Meeting Reschedule Requested by Manager",
                    "Manager " + meeting.getManager().getEmployeeName() + " proposed a new time for: " + meeting.getTitle(),
                    "MEETING");
        }

        meeting.setRescheduleReason(request.rescheduleReason());
        meeting.setProposedTime(request.proposedTime());
        meeting = meetingRepository.save(meeting);

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse acceptReschedule(Long id, Long userId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        
        boolean isManager = meeting.getManager().getUserAccount().getId().equals(userId);
        boolean isEmployee = meeting.getEmployee().getUserAccount().getId().equals(userId);

        if (!isManager && !isEmployee) {
            throw new RuntimeException("Unauthorized");
        }

        // If employee accepts a manager proposal
        if (isEmployee && meeting.getStatus() == MeetingStatus.RESCHEDULE_MGR) {
            confirmReschedule(meeting);
            notificationService.send(
                    meeting.getManager().getUserAccount(),
                    "Meeting Reschedule Accepted",
                    meeting.getEmployee().getEmployeeName() + " accepted the new time for: " + meeting.getTitle(),
                    "MEETING");
        } 
        // If manager accepts an employee proposal
        else if (isManager && meeting.getStatus() == MeetingStatus.RESCHEDULE_REQUESTED) {
            confirmReschedule(meeting);
            notificationService.send(
                    meeting.getEmployee().getUserAccount(),
                    "Meeting Reschedule Approved",
                    "Manager " + meeting.getManager().getEmployeeName() + " approved the new time for: " + meeting.getTitle(),
                    "MEETING");
        } else {
            throw new RuntimeException("Invalid action for current meeting status");
        }

        return mapToResponse(meetingRepository.save(meeting));
    }

    private void confirmReschedule(Meeting meeting) {
        meeting.setStatus(MeetingStatus.ACCEPTED);
        if (meeting.getProposedTime() != null) {
            meeting.setScheduledTime(meeting.getProposedTime());
        }
        meeting.setProposedTime(null);
        meeting.setRescheduleReason(null);
    }

    @Scheduled(fixedRate = 60000) // Check every minute
    @Transactional
    public void sendMeetingReminders() {
        Instant now = Instant.now();
        Instant fiveMinFromNow = now.plus(5, ChronoUnit.MINUTES);
        
        // 1. Five-minute reminder
        List<Meeting> fiveMinReminders = meetingRepository.findByStatusIn(List.of(MeetingStatus.ACCEPTED))
                .stream()
                .filter(m -> m.getFiveMinReminderSent() == null || !m.getFiveMinReminderSent())
                .filter(m -> m.getScheduledTime().isBefore(fiveMinFromNow) || m.getScheduledTime().equals(fiveMinFromNow))
                .collect(Collectors.toList());

        for (Meeting m : fiveMinReminders) {
            String timeStr = m.getScheduledTime().atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"));
            String dept = m.getEmployee().getDepartment() != null ? m.getEmployee().getDepartment().getName() : "N/A";
            
            String msg = String.format("Reminder: Meeting '%s' (Status: %s) starts in 5 minutes (at %s). Participant: %s (Dept: %s).", 
                    m.getTitle(), m.getStatus(), timeStr, m.getEmployee().getEmployeeName(), dept);
            
            notificationService.send(m.getManager().getUserAccount(), "Meeting Starting Soon", msg, "MEETING");
            
            String employeeMsg = String.format("Reminder: Meeting '%s' (Status: %s) starts in 5 minutes (at %s). Manager: %s.", 
                    m.getTitle(), m.getStatus(), timeStr, m.getManager().getEmployeeName());
            notificationService.send(m.getEmployee().getUserAccount(), "Meeting Starting Soon", employeeMsg, "MEETING");
            
            m.setFiveMinReminderSent(true);
            meetingRepository.save(m);
        }

        // 2. 9:00 AM Morning reminder
        ZonedDateTime nowZoned = ZonedDateTime.now(ZoneId.systemDefault());
        if (nowZoned.getHour() == 9 && nowZoned.getMinute() == 0) {
            LocalDate today = nowZoned.toLocalDate();
            Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

            List<Meeting> morningReminders = meetingRepository.findByStatusIn(List.of(MeetingStatus.ACCEPTED))
                    .stream()
                    .filter(m -> m.getMorningReminderSent() == null || !m.getMorningReminderSent())
                    .filter(m -> m.getScheduledTime().isAfter(startOfDay) && m.getScheduledTime().isBefore(endOfDay))
                    .collect(Collectors.toList());

            for (Meeting m : morningReminders) {
                String timeStr = m.getScheduledTime().atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"));
                String dept = m.getEmployee().getDepartment() != null ? m.getEmployee().getDepartment().getName() : "N/A";

                String msg = String.format("Meeting Today: '%s' (Status: %s) is scheduled for %s. Participant: %s (Dept: %s).", 
                        m.getTitle(), m.getStatus(), timeStr, m.getEmployee().getEmployeeName(), dept);
                
                notificationService.send(m.getManager().getUserAccount(), "Meeting Reminder", msg, "MEETING");
                
                String employeeMsg = String.format("Meeting Today: '%s' (Status: %s) is scheduled for %s. Manager: %s.", 
                        m.getTitle(), m.getStatus(), timeStr, m.getManager().getEmployeeName());
                notificationService.send(m.getEmployee().getUserAccount(), "Meeting Reminder", employeeMsg, "MEETING");
                
                m.setMorningReminderSent(true);
                meetingRepository.save(m);
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Check every minute
    @Transactional
    public void autoStartMeetings() {
        Instant now = Instant.now();
        List<Meeting> pendingStart = meetingRepository.findByStatusIn(List.of(MeetingStatus.ACCEPTED))
                .stream()
                .filter(m -> m.getScheduledTime().isBefore(now) || m.getScheduledTime().equals(now))
                .collect(Collectors.toList());

        for (Meeting meeting : pendingStart) {
            meeting.setStatus(MeetingStatus.ONGOING);
            meeting.setActualStartTime(now);
            meetingRepository.save(meeting);
            
            notificationService.send(
                    meeting.getManager().getUserAccount(),
                    "Meeting Started",
                    "The scheduled meeting with " + meeting.getEmployee().getEmployeeName() + " has automatically started.",
                    "MEETING");
            notificationService.send(
                    meeting.getEmployee().getUserAccount(),
                    "Meeting Started",
                    "The scheduled meeting with Manager " + meeting.getManager().getEmployeeName() + " has automatically started.",
                    "MEETING");
        }
    }

    @Transactional
    public MeetingResponse updateStatus(Long id, Long userId, MeetingStatus status) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        verifyParticipant(meeting, userId);

        if (status == MeetingStatus.ONGOING) {
            Instant now = Instant.now();
            if (meeting.getActualStartTime() == null) {
                meeting.setActualStartTime(now);
            }
            // Update scheduled time to actual start time as per user request
            meeting.setScheduledTime(now);
        }

        meeting.setStatus(status);
        meeting = meetingRepository.save(meeting);
        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse finishMeeting(Long id, Long userId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        
        if (!meeting.getManager().getUserAccount().getId().equals(userId)) {
            throw new RuntimeException("Only the manager can finish the meeting");
        }

        if (meeting.getStatus() != MeetingStatus.ONGOING) {
            throw new RuntimeException("Meeting must be ongoing to be finished");
        }

        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting.setActualEndTime(Instant.now());
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getEmployee().getUserAccount(),
                "Meeting Completed",
                "Manager " + meeting.getManager().getEmployeeName() + " has finalized and completed the meeting: " + meeting.getTitle(),
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingNoteResponse addNote(Long meetingId, Long userId, MeetingNoteRequest request) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        verifyParticipant(meeting, userId);

        if (meeting.getStatus() == MeetingStatus.COMPLETED) {
            throw new RuntimeException("Cannot add notes to a completed meeting");
        }

        Employee author = userRepository.findById(userId)
                .map(User::getEmployee)
                .orElseThrow(() -> new RuntimeException("Author employee not found"));

        MeetingNoteType noteType = author.getId().equals(meeting.getManager().getId())
                ? MeetingNoteType.MANAGER_NOTE
                : MeetingNoteType.EMPLOYEE_NOTE;

        MeetingNote note = new MeetingNote();
        note.setMeeting(meeting);
        note.setAuthor(author);
        note.setNoteType(noteType);
        note.setContent(request.content());

        note = meetingNoteRepository.save(note);
        return mapToNoteResponse(note);
    }

    @Transactional(readOnly = true)
    public List<MeetingNoteResponse> getMeetingNotes(Long meetingId, Long userId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));
        verifyParticipant(meeting, userId);

        return meetingNoteRepository.findByMeetingIdOrderByCreatedDateAsc(meetingId)
                .stream()
                .map(this::mapToNoteResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Employee> getEligibleEmployees(Long managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        if (manager.getPosition() == null || manager.getPosition().getLevelCode() == null) {
            return List.of();
        }

        Long managerLevelId = manager.getPosition().getLevelCode().getId();

        // Employees in same department
        List<Employee> deptEmployees = manager.getDepartment() != null
                ? employeeRepository.findByDepartmentId(manager.getDepartment().getId())
                : List.of();

        List<Employee> directSubordinates = employeeRepository.findByManagerId(manager.getId());

        Set<Employee> eligible = new HashSet<>();
        eligible.addAll(deptEmployees);
        eligible.addAll(directSubordinates);

        return eligible.stream()
                .filter(e -> e.getPosition() != null && e.getPosition().getLevelCode() != null)
                .filter(e -> e.getPosition().getLevelCode().getId() > managerLevelId)
                .filter(e -> !e.getId().equals(manager.getId()))
                .collect(Collectors.toList());
    }

    private void verifyParticipant(Meeting meeting, Long userId) {
        Long managerUserId = meeting.getManager().getUserAccount().getId();
        Long employeeUserId = meeting.getEmployee().getUserAccount().getId();
        if (!managerUserId.equals(userId) && !employeeUserId.equals(userId)) {
            throw new RuntimeException("Access denied to this meeting");
        }
    }

    @Transactional
    public MeetingResponse cancelMeeting(Long id, Long userId, String reason) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getManager().getUserAccount().getId().equals(userId)) {
            throw new RuntimeException("Only the manager can cancel a meeting directly");
        }

        meeting.setStatus(MeetingStatus.CANCELLED);
        meeting.setCancellationReason(reason);
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getEmployee().getUserAccount(),
                "Meeting Cancelled",
                "Manager " + meeting.getManager().getEmployeeName() + " cancelled the meeting: " + meeting.getTitle() + ". Reason: " + reason,
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse requestCancel(Long id, Long userId, String reason) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getEmployee().getUserAccount().getId().equals(userId)) {
            throw new RuntimeException("Only the employee can request cancellation");
        }

        meeting.setStatus(MeetingStatus.CANCEL_REQUESTED);
        meeting.setCancellationReason(reason);
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getManager().getUserAccount(),
                "Meeting Cancellation Requested",
                meeting.getEmployee().getEmployeeName() + " requested to cancel the meeting: " + meeting.getTitle() + ". Reason: " + reason,
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse approveCancel(Long id, Long userId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getManager().getUserAccount().getId().equals(userId)) {
            throw new RuntimeException("Only the manager can approve cancellation");
        }

        meeting.setStatus(MeetingStatus.CANCELLED);
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getEmployee().getUserAccount(),
                "Meeting Cancellation Approved",
                "Manager " + meeting.getManager().getEmployeeName() + " approved your cancellation request for: " + meeting.getTitle(),
                "MEETING");

        return mapToResponse(meeting);
    }

    @Transactional
    public MeetingResponse rejectCancel(Long id, Long userId) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (!meeting.getManager().getUserAccount().getId().equals(userId)) {
            throw new RuntimeException("Only the manager can reject cancellation");
        }

        meeting.setStatus(MeetingStatus.ACCEPTED); // Revert to accepted
        meeting.setCancellationReason(null);
        meeting = meetingRepository.save(meeting);

        notificationService.send(
                meeting.getEmployee().getUserAccount(),
                "Meeting Cancellation Rejected",
                "Manager " + meeting.getManager().getEmployeeName() + " rejected your cancellation request for: " + meeting.getTitle(),
                "MEETING");

        return mapToResponse(meeting);
    }

    private MeetingResponse mapToResponse(Meeting meeting) {
        return new MeetingResponse(
                meeting.getId(),
                meeting.getManager().getId(),
                meeting.getManager().getUserAccount() != null ? meeting.getManager().getUserAccount().getId() : null,
                meeting.getManager().getEmployeeName(),
                meeting.getEmployee().getId(),
                meeting.getEmployee().getUserAccount() != null ? meeting.getEmployee().getUserAccount().getId() : null,
                meeting.getEmployee().getEmployeeName(),
                meeting.getEmployee().getDepartment() != null ? meeting.getEmployee().getDepartment().getName() : null,
                meeting.getTitle(),
                meeting.getDescription(),
                meeting.getScheduledTime(),
                meeting.getDurationMinutes(),
                meeting.getStatus(),
                meeting.getRescheduleReason(),
                meeting.getCancellationReason(),
                meeting.getProposedTime(),
                meeting.getActualStartTime(),
                meeting.getActualEndTime(),
                meeting.getCreatedDate()
        );
    }

    private MeetingNoteResponse mapToNoteResponse(MeetingNote note) {
        return new MeetingNoteResponse(
                note.getId(),
                note.getMeeting().getId(),
                note.getAuthor().getId(),
                note.getAuthor().getEmployeeName(),
                note.getNoteType(),
                note.getContent(),
                note.getCreatedDate());
    }
}
