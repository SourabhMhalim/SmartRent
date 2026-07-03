package com.smartrent.api.profile;

import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.profile.ProfileModels.ProfileRequest;
import com.smartrent.api.profile.ProfileModels.ProfileResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final ProfileRepository repository;

    public ProfileService(ProfileRepository repository) {
        this.repository = repository;
    }

    public ProfileResponse getProfile(UUID profileId) {
        return repository.findById(profileId).orElseThrow(this::profileNotFound);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID profileId, ProfileRequest request) {
        boolean hasUpiId = request.upiId() != null;
        boolean hasPayeeName = request.upiPayeeName() != null;
        if (hasUpiId != hasPayeeName) {
            throw new DomainException(
                    400,
                    "UPI ID and payee name must be provided together.",
                    "incomplete_upi_profile"
            );
        }
        return repository.update(profileId, request).orElseThrow(this::profileNotFound);
    }

    private DomainException profileNotFound() {
        return new DomainException(404, "Landlord profile was not found.", "profile_not_found");
    }
}
