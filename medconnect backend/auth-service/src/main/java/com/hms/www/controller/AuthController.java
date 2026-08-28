package com.hms.www.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import com.hms.www.dto.LoginRequest;
import com.hms.www.dto.LoginResponse;
import com.hms.www.dto.RegisterRequest;
import com.hms.www.entity.User;
import com.hms.www.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
@RestController 

@RequestMapping("/auth") 

@RequiredArgsConstructor 

public class AuthController { 

    	private final AuthService authService; 

    	@PostMapping("/register") 

    	public ResponseEntity<String> register( 

            @RequestBody @Valid RegisterRequest request) { 

    		
       	 return ResponseEntity.ok( 

              authService.register(request) 

        ); 

    } 

    	@PostMapping("/login") 

   	 public ResponseEntity<LoginResponse> login( 

            @RequestBody LoginRequest request) { 

       	   return ResponseEntity.ok( 

                authService.login(request) 

        ); 

    } 

    @PutMapping("/update/{id}")
    public ResponseEntity<String> update(
            @PathVariable Long id,
            @RequestBody RegisterRequest request) {

        return ResponseEntity.ok(
                authService.updateUser(id, request)
        );
    }
}