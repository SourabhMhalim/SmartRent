package com.smartrent.api.property;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class PropertyRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsAndNormalizesAValidProperty() {
        PropertyModels.PropertyRequest request = new PropertyModels.PropertyRequest(
                "  Lakeview Residency ",
                PropertyModels.PropertyType.APARTMENT,
                "  12 Baner Road ",
                " Pune ",
                " Maharashtra ",
                " 411045 ",
                " "
        );

        assertThat(validator.validate(request)).isEmpty();
        assertThat(request.name()).isEqualTo("Lakeview Residency");
        assertThat(request.city()).isEqualTo("Pune");
        assertThat(request.description()).isNull();
    }

    @Test
    void rejectsNegativeUnitCharges() {
        PropertyModels.UnitRequest request = new PropertyModels.UnitRequest(
                "A-101",
                "1",
                new BigDecimal("-1"),
                new BigDecimal("-0.50"),
                PropertyModels.UnitStatus.VACANT,
                null
        );

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("baseRent", "electricityRate");
    }
}
