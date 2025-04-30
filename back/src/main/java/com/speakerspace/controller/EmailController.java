package com.speakerspace.controller;

import com.speakerspace.dto.EmailRequestDTO;
import com.speakerspace.service.FormSubmitEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/emails")
public class EmailController {
    private static final Logger logger = LoggerFactory.getLogger(EmailController.class);
    private final FormSubmitEmailService emailService;

    public EmailController(FormSubmitEmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/team-invitation")
    public ResponseEntity<Void> sendTeamInvitation(@RequestBody EmailRequestDTO request) {
        logger.info("Received request to send team invitation to: {}", request.getRecipientEmail());

        try {
            boolean sent = emailService.sendTeamInvitation(
                    request.getRecipientEmail(),
                    request.getTeamName(),
                    request.getTeamId(),
                    request.getInviterName()
            );

            if (sent) {
                logger.info("Successfully sent invitation email to: {}", request.getRecipientEmail());
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Failed to send invitation email to: {}", request.getRecipientEmail());
                return ResponseEntity.internalServerError().build();
            }
        } catch (Exception e) {
            logger.error("Error sending invitation email: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
