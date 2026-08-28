package com.hms.www.service;

import com.hms.www.dto.LoginRequest;
import com.hms.www.dto.LoginResponse;
import com.hms.www.dto.RegisterRequest;

public interface AuthService {
	String register(RegisterRequest request); 
    LoginResponse login(LoginRequest request); 
    String updateUser(Long id, RegisterRequest request); 
}
