package com.smartrent.api.property;

import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import com.smartrent.api.auth.AuthorizationService;
import com.smartrent.api.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PropertyController.class)
@Import(SecurityConfig.class)
class PropertyControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PropertyService service;

    @MockitoBean
    private AuthorizationService authorizationService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void rejectsPropertyRequestsWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/properties"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passesTheAuthenticatedLandlordIdToTheService() throws Exception {
        UUID landlordId = UUID.randomUUID();
        org.mockito.Mockito.when(authorizationService.requireLandlordWorkspace(
                        org.mockito.ArgumentMatchers.any()))
                .thenReturn(landlordId);
        org.mockito.Mockito.when(service.listProperties(landlordId, ""))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/properties")
                        .with(jwt().jwt(token -> token.subject(landlordId.toString()))))
                .andExpect(status().isOk());

        verify(service).listProperties(landlordId, "");
    }
}
