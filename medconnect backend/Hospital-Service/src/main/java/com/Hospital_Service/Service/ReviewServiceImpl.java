package com.Hospital_Service.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Hospital_Service.Dto.ReviewRequest;
import com.Hospital_Service.Dto.ReviewResponse;
import com.Hospital_Service.Repository.ReviewRepository;
import com.Hospital_Service.entity.Review;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Override
    public ReviewResponse createReview(ReviewRequest request) {
        // 1. Validation: Rating 1–5
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars.");
        }

        // 2. Validation: Target type & Role permissions
        String role = request.getReviewerRole() != null ? request.getReviewerRole().toUpperCase() : "USER";
        String target = request.getTargetType() != null ? request.getTargetType().toUpperCase() : "";

        if ("DOCTOR".equals(role) || "HOSPITAL".equals(role)) {
            if (!"MEDCONNECT".equals(target)) {
                throw new IllegalArgumentException(role + " users can only review MEDCONNECT website.");
            }
        } else if ("USER".equals(role) || "PATIENT".equals(role)) {
            if (!"DOCTOR".equals(target) && !"HOSPITAL".equals(target) && !"MEDCONNECT".equals(target)) {
                throw new IllegalArgumentException("Patients can only review DOCTOR, HOSPITAL, or MEDCONNECT.");
            }
        }

        // 3. Backend 1-Month Cooldown Frequency Check
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        List<Review> latestReviews;
        if ("MEDCONNECT".equals(target) || request.getTargetId() == null) {
            latestReviews = reviewRepository.findLatestReviewForTarget(request.getReviewerId(), role, target);
        } else {
            latestReviews = reviewRepository.findLatestReviewForTargetWithId(request.getReviewerId(), role, target, request.getTargetId());
        }

        if (!latestReviews.isEmpty()) {
            Review lastReview = latestReviews.get(0);
            if (lastReview.getCreatedAt().isAfter(oneMonthAgo)) {
                throw new IllegalStateException("You can only submit a review for this target once every 1 month.");
            }
        }

        // 4. Save review
        Review review = new Review();
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setReviewerId(request.getReviewerId());
        review.setReviewerRole(role);
        review.setTargetType(target);
        review.setTargetId(request.getTargetId());
        review.setAppointmentId(request.getAppointmentId());
        review.setPaymentId(request.getPaymentId());
        review.setCreatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Override
    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> getReviewsByDoctor(Long doctorId) {
        return reviewRepository.findByTargetTypeAndTargetId("DOCTOR", doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> getReviewsByHospital(Long hospitalId) {
        return reviewRepository.findByTargetTypeAndTargetId("HOSPITAL", hospitalId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewResponse> getMedConnectReviews() {
        return reviewRepository.findByTargetType("MEDCONNECT").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Boolean> checkEligibility(Long reviewerId, String reviewerRole, String targetType, Long targetId) {
        String role = reviewerRole != null ? reviewerRole.toUpperCase() : "USER";
        String target = targetType != null ? targetType.toUpperCase() : "MEDCONNECT";

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        List<Review> latestReviews;
        if ("MEDCONNECT".equals(target) || targetId == null) {
            latestReviews = reviewRepository.findLatestReviewForTarget(reviewerId, role, target);
        } else {
            latestReviews = reviewRepository.findLatestReviewForTargetWithId(reviewerId, role, target, targetId);
        }

        boolean eligible = true;
        if (!latestReviews.isEmpty()) {
            Review lastReview = latestReviews.get(0);
            if (lastReview.getCreatedAt().isAfter(oneMonthAgo)) {
                eligible = false;
            }
        }

        Map<String, Boolean> res = new HashMap<>();
        res.put("eligible", eligible);
        return res;
    }

    private ReviewResponse mapToResponse(Review r) {
        ReviewResponse res = new ReviewResponse();
        res.setId(r.getId());
        res.setRating(r.getRating());
        res.setComment(r.getComment());
        res.setReviewerId(r.getReviewerId());
        res.setReviewerRole(r.getReviewerRole());
        res.setTargetType(r.getTargetType());
        res.setTargetId(r.getTargetId());
        res.setAppointmentId(r.getAppointmentId());
        res.setPaymentId(r.getPaymentId());
        res.setCreatedAt(r.getCreatedAt());
        return res;
    }
}
