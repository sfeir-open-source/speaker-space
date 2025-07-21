package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.ReviewDTO;
import com.speakerspace.model.session.Reviews;
import org.springframework.stereotype.Component;

@Component
public class ReviewsMapper {

    public ReviewDTO convertToDTO (Reviews reviews) {
        if(reviews  == null) return null;

        return new ReviewDTO(
            reviews.getAverage(),
            reviews.getPositives(),
            reviews.getNegatives()
        );
    }

    public Reviews convertToEntity (ReviewDTO reviewsDTO) {
        if (reviewsDTO  == null) return null;

        Reviews reviews = new Reviews();
        reviews.setAverage(reviewsDTO.average());
        reviews.setPositives(reviewsDTO.positives());
        reviews.setNegatives(reviewsDTO.negatives());

        return reviews;
    }
}
