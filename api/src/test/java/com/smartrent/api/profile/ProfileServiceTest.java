package com.smartrent.api.profile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.profile.ProfileModels.ProfileRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository repository;

    @Test
    void rejectsIncompleteUpiProfile() {
        ProfileService service = new ProfileService(repository);
        UUID profileId = UUID.randomUUID();
        ProfileRequest request = new ProfileRequest(
                "Sourabh",
                null,
                null,
                "sourabh@upi"
        );

        assertThatThrownBy(() -> service.updateProfile(profileId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("UPI ID and payee name must be provided together.");

        verify(repository, never()).update(profileId, request);
    }
}
