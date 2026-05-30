package com.epms.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.PromotionProposal;
import com.epms.backend.repository.PromotionProposalRepository;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private PromotionProposalRepository promotionProposalRepository;

	@Autowired
	private EmployeeRepository employeeRepository;

	@Autowired
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}
}
