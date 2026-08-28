package com.hms.www.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hms.www.dto.LoginRequest;
import com.hms.www.dto.LoginResponse;
import com.hms.www.dto.RegisterRequest;
import com.hms.www.entity.Role;
import com.hms.www.entity.User;
import com.hms.www.repository.RoleRepository;
import com.hms.www.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor 
public class AuthServiceImpl implements AuthService 
{ 
	private final UserRepository userRepository; 
	
	private final RoleRepository roleRepository; 
	
	private final PasswordEncoder passwordEncoder;
	
	private final JwtService jwtService; 

	private final OtpService otpService;
	
	@Override
	public String register(RegisterRequest request)
	{
		if(userRepository.existsByemail(request.getEmail()))
		{
			throw new RuntimeException("Email already exists");
		}

		// Mobile OTP verification is required for self-service Patient (USER)
		// and Doctor sign-ups. Admin/Hospital creation flows are unaffected.
		String roleName = request.getRoleName();
		if ("USER".equalsIgnoreCase(roleName) || "DOCTOR".equalsIgnoreCase(roleName)) {
			if (!otpService.isMobileVerified(request.getMobile())) {
				throw new RuntimeException("Mobile number is not verified. Please verify OTP before registering.");
			}
		}

		 Role role = roleRepository 
				 .findByRoleName(request.getRoleName())
				 .orElseThrow(() ->  
				 new RuntimeException("Role not found")); 
		 User user = new User();
		  user.setFullName(request.getFullName());
		  user.setEmail(request.getEmail()); 
		  user.setMobile(request.getMobile()); 
		  user.setPassword(passwordEncoder.encode(request.getPassword()));
		  user.setRole(role);
		  userRepository.save(user);

		if ("USER".equalsIgnoreCase(roleName) || "DOCTOR".equalsIgnoreCase(roleName)) {
			otpService.consumeVerification(request.getMobile());
		}

		  return "User Registered Successfully";
			
	}
	@Override
	public LoginResponse login(LoginRequest request) 
	{
		User user=userRepository.findByEmail(request.getEmail())
				.orElseThrow(()->new RuntimeException("Invalid email"));
		boolean matches=passwordEncoder.matches(request.getPassword(), user.getPassword());
		if(!matches)
		{
			throw new RuntimeException("Invalid password");
		}
		   String token = 

		            jwtService.generateToken( 

		                    user.getEmail(), 

		                    user.getRole().getRoleName() 

		            ); 
		return new LoginResponse(user.getId(),user.getFullName(),user.getRole().getRoleName(),token);
	}

	@Override
	public String updateUser(Long id, RegisterRequest request) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("User not found"));
		
		if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByemail(request.getEmail())) {
			throw new RuntimeException("Email already exists");
		}
		
		user.setFullName(request.getFullName());
		user.setEmail(request.getEmail());
		user.setMobile(request.getMobile());
		
		userRepository.save(user);
		return "User updated successfully";
	}
}
