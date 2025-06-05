package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.ReviewDTO;
import com.speakerspace.model.session.Reviews;
import org.springframework.stereotype.Component;

@Component
public class ReviewsMapper {

    public ReviewDTO convertToDTO (Reviews reviews) {
        if(reviews == null) {
            return null;
        }

        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setAverage(reviews.getAverage());
        reviewDTO.setPositives(reviews.getPositives());
        reviewDTO.setNegatives(reviews.getNegatives());

        return reviewDTO;
    }

    public Reviews convertToEntity (ReviewDTO reviewsDTO) {
        if (reviewsDTO == null) {
            return null;
        }

        Reviews reviews = new Reviews();
        reviews.setAverage(reviewsDTO.getAverage());
        reviews.setPositives(reviewsDTO.getPositives());
        reviews.setNegatives(reviewsDTO.getNegatives());

        return reviews;
    }
}
