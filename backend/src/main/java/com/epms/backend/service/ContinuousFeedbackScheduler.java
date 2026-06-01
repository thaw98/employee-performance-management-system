package com.epms.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContinuousFeedbackScheduler {

    private final ContinuousFeedbackService continuousFeedbackService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void publishScheduledFeedback() {
        log.debug("Checking for due scheduled feedback...");
        try {
            continuousFeedbackService.processScheduledFeedback();
        } catch (Exception e) {
            log.error("Error processing scheduled feedback: {}", e.getMessage());
        }
    }
}
