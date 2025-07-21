package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.CategoryDTO;
import com.speakerspace.model.session.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryDTO convertToDTO(Category category) {
        if(category  == null) return null;

        return new CategoryDTO(
            category.getId(),
            category.getName(),
            category.getDescription()
        );
    }

    public Category convertToEntity(CategoryDTO categoryDTO) {
        if(categoryDTO  == null) return null;

        Category category = new Category();
        category.setId(categoryDTO.id());
        category.setName(categoryDTO.name());
        category.setDescription(categoryDTO.description());

        return category;
    }
}