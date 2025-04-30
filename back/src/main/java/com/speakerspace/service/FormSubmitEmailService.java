package com.speakerspace.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class FormSubmitEmailService {
    private static final Logger logger = LoggerFactory.getLogger(FormSubmitEmailService.class);
    private final String FORMSUBMIT_URL = "https://formsubmit.co/ajax/";

    @Value("${formsubmit.email}")
    private String formSubmitEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    @Autowired
    public FormSubmitEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean sendTeamInvitation(String recipientEmail, String teamName,
                                      String teamId, String inviterName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json, text/plain, */*");

        String invitationLink = frontendUrl + "/team/" + teamId;

        Map<String, Object> data = new HashMap<>();
        data.put("email", recipientEmail);
        data.put("_replyto", recipientEmail);
        data.put("_subject", "Invitation à rejoindre l'équipe " + teamName);
        data.put("_template", "table");
        data.put("inviterName", inviterName);
        data.put("teamName", teamName);
        data.put("invitationLink", invitationLink);
        data.put("message", "Vous avez été invité(e) par " + inviterName +
                " à rejoindre l'équipe \"" + teamName +
                "\". Cliquez sur ce lien pour vous connecter: " + invitationLink);
        data.put("_autoresponse", "Bonjour,\n\nVous avez été invité(e) par " +
                inviterName + " à rejoindre l'équipe \"" + teamName +
                "\" sur Speaker Space.\n\nCliquez sur ce lien pour vous connecter: " +
                invitationLink + "\n\nCordialement,\nL'équipe Speaker Space");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    FORMSUBMIT_URL + formSubmitEmail,
                    request,
                    String.class
            );

            logger.info("Email sent via FormSubmit with status: {}", response.getStatusCode());
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Error sending email via FormSubmit: {}", e.getMessage(), e);
            return false;
        }
    }
}
