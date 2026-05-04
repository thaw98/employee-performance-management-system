package com.epms.backend.config;

import com.epms.backend.dto.KpiTemplateDto;
import com.epms.backend.service.KpiTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class KpiTemplateDataInitializer implements CommandLineRunner {

    private final KpiTemplateService templateService;

    @Override
    public void run(String... args) throws Exception {
        if (!templateService.getTemplates("INDIVIDUAL", null, null).isEmpty()) {
            return;
        }

        // 1. Individual Template
        KpiTemplateDto individualTemplate = new KpiTemplateDto();
        individualTemplate.setName("Standard Employee Template");
        individualTemplate.setType("INDIVIDUAL");
        
        KpiTemplateDto.KpiTemplateItemDto item1 = new KpiTemplateDto.KpiTemplateItemDto();
        item1.setName("Quantity of Work");
        item1.setCategory("Performance");
        item1.setTarget("100%");
        item1.setUnit("Percentage");
        item1.setWeight(new BigDecimal("40"));

        KpiTemplateDto.KpiTemplateItemDto item2 = new KpiTemplateDto.KpiTemplateItemDto();
        item2.setName("Quality of Work");
        item2.setCategory("Performance");
        item2.setTarget("Zero Errors");
        item2.setUnit("Rating");
        item2.setWeight(new BigDecimal("40"));

        KpiTemplateDto.KpiTemplateItemDto item3 = new KpiTemplateDto.KpiTemplateItemDto();
        item3.setName("Attendance & Punctuality");
        item3.setCategory("Behavioral");
        item3.setTarget("95%");
        item3.setUnit("Percentage");
        item3.setWeight(new BigDecimal("20"));

        individualTemplate.setItems(Arrays.asList(item1, item2, item3));
        templateService.createTemplate(individualTemplate);

        // 2. Department Template (e.g. for IT - assuming ID 1 for now, or just generic)
        KpiTemplateDto deptTemplate = new KpiTemplateDto();
        deptTemplate.setName("IT Department Core KPIs");
        deptTemplate.setType("DEPARTMENT");
        // deptTemplate.setDepartmentId(1L); // Adjust based on actual ID if known

        KpiTemplateDto.KpiTemplateItemDto dItem1 = new KpiTemplateDto.KpiTemplateItemDto();
        dItem1.setName("System Uptime");
        dItem1.setCategory("Operations");
        dItem1.setTarget("99.9%");
        dItem1.setUnit("Percentage");
        dItem1.setWeight(new BigDecimal("60"));

        KpiTemplateDto.KpiTemplateItemDto dItem2 = new KpiTemplateDto.KpiTemplateItemDto();
        dItem2.setName("Security Compliance");
        dItem2.setCategory("Governance");
        dItem2.setTarget("100%");
        dItem2.setUnit("Percentage");
        dItem2.setWeight(new BigDecimal("40"));

        deptTemplate.setItems(Arrays.asList(dItem1, dItem2));
        templateService.createTemplate(deptTemplate);
    }
}
