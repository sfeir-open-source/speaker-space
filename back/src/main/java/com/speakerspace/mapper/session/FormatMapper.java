package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.FormatDTO;
import com.speakerspace.model.session.Format;
import org.springframework.stereotype.Component;

@Component
public class FormatMapper {

    public FormatDTO convertToDTO(Format format) {
        if(format == null) {
            return null;
        }

        FormatDTO formatDTO = new FormatDTO();
        formatDTO.setId(format.getId());
        formatDTO.setName(format.getName());
        formatDTO.setDescription(format.getDescription());

        return formatDTO;
    }

    public Format convertToEntity(FormatDTO formatDTO) {
        if(formatDTO == null) {
            return null;
        }

        Format format = new Format();
        format.setId(formatDTO.getId());
        format.setName(formatDTO.getName());
        format.setDescription(formatDTO.getDescription());

        return format;
    }

}
