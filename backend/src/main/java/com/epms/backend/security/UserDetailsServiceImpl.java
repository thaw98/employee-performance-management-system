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
		System.out.println("DEBUG: Loading user by ID: " + id);
		return userRepository.findById(id)
				.map(user -> {
					System.out.println("DEBUG: User found: " + user.getEmail() + " with role: " + user.getRole().getName());
					return new UserPrincipal(user);
				})
				.orElseThrow(() -> {
					System.out.println("DEBUG: User NOT found with ID: " + id);
					return new UsernameNotFoundException("User not found");
				});
	}
}
