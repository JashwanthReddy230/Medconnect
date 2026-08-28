package com.Hospital_Service.Service;

import java.util.List;
import java.util.Map;

import com.Hospital_Service.Dto.ReviewRequest;
import com.Hospital_Service.Dto.ReviewResponse;

public interface ReviewService {

    ReviewResponse createReview(ReviewRequest request);

    List<ReviewResponse> getAllReviews();

    List<ReviewResponse> getReviewsByDoctor(Long doctorId);

    List<ReviewResponse> getReviewsByHospital(Long hospitalId);

    List<ReviewResponse> getMedConnectReviews();

    Map<String, Boolean> checkEligibility(Long reviewerId, String reviewerRole, String targetType, Long targetId);
}
