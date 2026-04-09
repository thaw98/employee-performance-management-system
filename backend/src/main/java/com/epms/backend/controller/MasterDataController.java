package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.master.MasterOptionDto;
import com.epms.backend.service.MasterDataService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class MasterDataController {
	private final MasterDataService masterDataService;

	@GetMapping("/api/master/religions")
	public ResponseEntity<ApiResponse<List<MasterOptionDto>>> religions() {
		return ResponseEntity.ok(ApiResponse.ok("Religions", masterDataService.getReligions()));
	}

	@GetMapping("/api/master/nationalities")
	public ResponseEntity<ApiResponse<List<MasterOptionDto>>> nationalities() {
		return ResponseEntity.ok(ApiResponse.ok("Nationalities", masterDataService.getNationalities()));
	}

	@GetMapping("/api/master/nationalities/autocomplete")
	public ResponseEntity<ApiResponse<List<MasterOptionDto>>> nationalitiesAutocomplete(
			@RequestParam(defaultValue = "") String keyword) {
		return ResponseEntity.ok(ApiResponse.ok("Nationalities", masterDataService.autocompleteNationalities(keyword)));
	}

	@GetMapping("/api/departments/autocomplete")
	public ResponseEntity<ApiResponse<List<MasterOptionDto>>> departments(@RequestParam(defaultValue = "") String keyword) {
		return ResponseEntity.ok(ApiResponse.ok("Departments", masterDataService.autocompleteDepartments(keyword)));
	}

	@GetMapping("/api/positions/autocomplete")
	public ResponseEntity<ApiResponse<List<MasterOptionDto>>> positions(@RequestParam(defaultValue = "") String keyword) {
		return ResponseEntity.ok(ApiResponse.ok("Positions", masterDataService.autocompletePositions(keyword)));
	}
}
