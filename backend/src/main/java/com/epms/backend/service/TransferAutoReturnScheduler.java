package com.epms.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.TransferType;
import com.epms.backend.repository.EmployeeDepartmentHistoryRepository;
import com.epms.backend.dto.transfer.TransferHistoryResponseDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransferAutoReturnScheduler {

    private final EmployeeDepartmentHistoryRepository historyRepository;
    private final EmployeeTransferService transferService;

    @Scheduled(cron = "0 5 0 * * *")
    public void autoReturnExpiredTemporaryTransfers() {
        LocalDate today = LocalDate.now();
        List<EmployeeDepartmentHistory> expiredTransfers =
            historyRepository.findByCurrentTrueAndTransferTypeAndEffectiveEndDateBefore(TransferType.TEMPORARY, today);

        for (EmployeeDepartmentHistory transfer : expiredTransfers) {
            try {
                TransferHistoryResponseDto returned = transferService.autoReturnExpiredTemporary(transfer.getId());
                log.info("Auto-returned employee {} from temporary transfer {}", returned.getEmployeeId(), transfer.getId());
            } catch (Exception ex) {
                log.warn("Failed to auto-return temporary transfer {}", transfer.getId(), ex);
            }
        }
    }
}
