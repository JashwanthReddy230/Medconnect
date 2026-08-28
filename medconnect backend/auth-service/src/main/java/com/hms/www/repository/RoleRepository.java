package com.hms.www.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.www.entity.Role;


@Repository
public interface RoleRepository extends JpaRepository<Role,Long>
{

	Optional<Role> findByRoleName(String role);
	
	
}
