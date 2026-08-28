package com.hms.www.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hms.www.entity.User;
import com.hms.www.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service 

@RequiredArgsConstructor 
public class CustomUserDetailsService implements UserDetailsService
{

	
private final UserRepository userRepository;	

@Override
public UserDetails loadUserByUsername( String email)  throws UsernameNotFoundException 
{
	User user=userRepository.findByEmail(email)
			.orElseThrow(()->new UsernameNotFoundException("user not found"));
    return org.springframework.security.core.userdetails.User 

            .builder() 
            .username(user.getEmail()) 
            .password(user.getPassword()) 
            .roles(user.getRole().getRoleName()) 
            .build(); 

} 
}

