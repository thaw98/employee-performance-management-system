package com.epms.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class KpiScheduler {
    private static final Logger logger = LoggerFactory.getLogger(KpiScheduler.class);
    private final KpiService kpiService;

    public KpiScheduler(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    /**
     * Automatically reset monthly KPI progress.
     * Runs at 00:00 on the 1st day of every month.
     * Cron format: "0 0 0 1 * *"
     */
    @Scheduled(cron = "0 0 0 1 * *")
    public void scheduleMonthlyKpiReset() {
        logger.info("Starting scheduled monthly KPI reset process...");
        try {
            // performerUserId = null for system-triggered reset
            kpiService.performMonthlyReset(null);
            logger.info("Scheduled monthly KPI reset completed successfully.");
        } catch (Exception e) {
            logger.error("Error during scheduled monthly KPI reset: ", e);
        }
    }
}
