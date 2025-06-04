package com.speakerspace.mapper;

import com.speakerspace.dto.session.SessionImportDTO;
import com.speakerspace.model.session.Session;
import org.springframework.stereotype.Component;

@Component
public class SessionMapper {

    public Session convertImportDTOToEntity(SessionImportDTO dto) {
        if (dto == null) {
            return null;
        }

        Session session = new Session();
        session.setId(dto.getId());
        session.setTitle(dto.getTitle());
        session.setAbstractText(dto.getSessionAbstract());
        session.setDeliberationStatus(dto.getDeliberationStatus() != null ? dto.getDeliberationStatus() : false);
        session.setConfirmationStatus(dto.getConfirmationStatus() != null ? dto.getConfirmationStatus() : false);
        session.setLevel(dto.getLevel());
        session.setReferences(dto.getReferences());

        return session;
    }
}
