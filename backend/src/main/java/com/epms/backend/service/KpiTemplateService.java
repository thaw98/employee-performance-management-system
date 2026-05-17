package com.epms.backend.service;

import com.epms.backend.dto.KpiTemplateDto;
import com.epms.backend.entity.KpiTemplate;
import com.epms.backend.entity.KpiTemplateItem;
import com.epms.backend.repository.KpiTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiTemplateService {

    private final KpiTemplateRepository templateRepository;

    @Transactional(readOnly = true)
    public List<KpiTemplateDto> getTemplates(String type, Long departmentId, Long positionId) {
        List<KpiTemplate> templates;
        if (positionId != null) {
            templates = templateRepository.findByTypeAndDepartmentIdAndPositionId(type, departmentId, positionId);
        } else if (departmentId != null) {
            templates = templateRepository.findByTypeAndDepartmentId(type, departmentId);
        } else {
            templates = templateRepository.findByType(type);
        }
        return templates.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public KpiTemplateDto createTemplate(KpiTemplateDto dto) {
        KpiTemplate template = new KpiTemplate();
        template.setName(dto.getName());
        template.setType(dto.getType());
        template.setDepartmentId(dto.getDepartmentId());
        template.setPositionId(dto.getPositionId());

        if (dto.getItems() != null) {
            for (KpiTemplateDto.KpiTemplateItemDto itemDto : dto.getItems()) {
                KpiTemplateItem item = new KpiTemplateItem();
                item.setName(itemDto.getName());
                item.setCategory(itemDto.getCategory());
                item.setTarget(itemDto.getTarget());
                item.setUnit(itemDto.getUnit());
                item.setWeight(itemDto.getWeight());
                template.addItem(item);
            }
        }

        KpiTemplate saved = templateRepository.save(template);
        return convertToDto(saved);
    }

    private KpiTemplateDto convertToDto(KpiTemplate entity) {
        KpiTemplateDto dto = new KpiTemplateDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setDepartmentId(entity.getDepartmentId());
        dto.setPositionId(entity.getPositionId());
        dto.setItems(entity.getItems().stream().map(item -> {
            KpiTemplateDto.KpiTemplateItemDto itemDto = new KpiTemplateDto.KpiTemplateItemDto();
            itemDto.setName(item.getName());
            itemDto.setCategory(item.getCategory());
            itemDto.setTarget(item.getTarget());
            itemDto.setUnit(item.getUnit());
            itemDto.setWeight(item.getWeight());
            return itemDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}
