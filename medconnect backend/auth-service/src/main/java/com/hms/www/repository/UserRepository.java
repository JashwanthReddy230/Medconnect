package com.hms.www.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.www.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User,Long>{

	boolean existsByemail(String email);
	Optional<User> findByEmail(String email);

}
