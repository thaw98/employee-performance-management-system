package com.epms.backend.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		long id;
		try {
			id = Long.parseLong(username);
		} catch (NumberFormatException ex) {
			throw new UsernameNotFoundException("Invalid user", ex);
		}
		return userRepository.findById(id)
				.map(UserPrincipal::new)
				.orElseThrow(() -> new UsernameNotFoundException("User not found"));
	}
}
