package com.Hospital_Service.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<Review> findByTargetType(String targetType);

    List<Review> findByReviewerIdAndReviewerRole(Long reviewerId, String reviewerRole);

    // Latest review for target without targetId (e.g. MEDCONNECT)
    @Query("SELECT r FROM Review r WHERE r.reviewerId = :reviewerId AND r.reviewerRole = :reviewerRole AND r.targetType = :targetType ORDER BY r.createdAt DESC")
    List<Review> findLatestReviewForTarget(
            @Param("reviewerId") Long reviewerId,
            @Param("reviewerRole") String reviewerRole,
            @Param("targetType") String targetType
    );

    // Latest review for target with specific targetId (e.g. DOCTOR, HOSPITAL)
    @Query("SELECT r FROM Review r WHERE r.reviewerId = :reviewerId AND r.reviewerRole = :reviewerRole AND r.targetType = :targetType AND r.targetId = :targetId ORDER BY r.createdAt DESC")
    List<Review> findLatestReviewForTargetWithId(
            @Param("reviewerId") Long reviewerId,
            @Param("reviewerRole") String reviewerRole,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId
    );
}
