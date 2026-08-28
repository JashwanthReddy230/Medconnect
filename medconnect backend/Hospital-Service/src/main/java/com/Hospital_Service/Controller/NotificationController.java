package com.Hospital_Service.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.Hospital_Service.Dto.NotificationResponse;
import com.Hospital_Service.Service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    // GET /notifications?patientId=1&limit=20
    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestParam Long patientId,
            @RequestParam(required = false) Integer limit) {

        List<NotificationResponse> notifications = service.getNotificationsForPatient(patientId, limit);

        Map<String, Object> body = new HashMap<>();
        body.put("notifications", notifications);
        return ResponseEntity.ok(body);
    }

    // GET /notifications/unread-count?patientId=1
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam Long patientId) {

        long count = service.getUnreadCount(patientId);

        Map<String, Object> body = new HashMap<>();
        body.put("count", count);
        return ResponseEntity.ok(body);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(service.markRead(id));
    }

    // PATCH /notifications/read-all?patientId=1
    @PatchMapping("/read-all")
    public ResponseEntity<String> markAllRead(@RequestParam Long patientId) {
        service.markAllRead(patientId);
        return ResponseEntity.ok("All Notifications Marked Read");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNotification(@PathVariable Long id) {
        service.deleteNotification(id);
        return ResponseEntity.ok("Notification Deleted Successfully");
    }
}