package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.FormatDTO;
import com.speakerspace.model.session.Format;
import org.springframework.stereotype.Component;

@Component
public class FormatMapper {

    public FormatDTO convertToDTO(Format format) {
        if(format  == null) return null;

        return new FormatDTO(
            format.getId(),
            format.getName(),
            format.getDescription()
        );
    }

    public Format convertToEntity(FormatDTO formatDTO) {
        if(formatDTO  == null) return null;

        Format format = new Format();
        format.setId(formatDTO.id());
        format.setName(formatDTO.name());
        format.setDescription(formatDTO.description());

        return format;
    }

}
