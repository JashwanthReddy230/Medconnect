package com.Hospital_Service.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Hospital_Service.Dto.ReviewRequest;
import com.Hospital_Service.Dto.ReviewResponse;
import com.Hospital_Service.Service.ReviewService;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest request) {
        try {
            ReviewResponse created = reviewService.createReview(request);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(reviewService.getReviewsByDoctor(doctorId));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(reviewService.getReviewsByHospital(hospitalId));
    }

    @GetMapping("/medconnect")
    public ResponseEntity<List<ReviewResponse>> getMedConnectReviews() {
        return ResponseEntity.ok(reviewService.getMedConnectReviews());
    }

    @GetMapping("/eligibility")
    public ResponseEntity<Map<String, Boolean>> checkEligibility(
            @RequestParam Long reviewerId,
            @RequestParam String reviewerRole,
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId) {

        return ResponseEntity.ok(reviewService.checkEligibility(reviewerId, reviewerRole, targetType, targetId));
    }

    @GetMapping("/admin")
    public ResponseEntity<List<ReviewResponse>> getAdminReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }
}
