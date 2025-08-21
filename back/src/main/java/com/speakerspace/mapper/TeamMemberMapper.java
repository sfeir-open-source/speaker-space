package com.speakerspace.mapper;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.TeamMember;
import com.speakerspace.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class TeamMemberMapper {

    private final UserService userService;

    public TeamMemberDTO convertMemberToDTO(TeamMember member) {
        UserDTO userDTO = userService.getUserByUid(member.getUserId());

        return TeamMemberDTO.builder()
                .userId(member.getUserId())
                .role(member.getRole())
                .email(member.getEmail())
                .name(userDTO != null ? userDTO.name() : null)
                .photoURL(userDTO != null ? userDTO.photoURL() : null)
                .status(member.getStatus())
                .build();
    }
}
