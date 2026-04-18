package com.epms.backend.service;

import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import com.epms.backend.repository.SignatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SignatureService {

    private final SignatureRepository signatureRepository;

    public List<Signature> getUserSignatures(User user) {
        return signatureRepository.findByUser(user);
    }

    public Optional<Signature> getDefaultSignature(User user) {
        return signatureRepository.findByUserAndIsDefaultTrue(user);
    }

    @Transactional
    public Signature saveSignature(User user, String data, String type, boolean setAsDefault) {
        if (setAsDefault) {
            signatureRepository.findByUserAndIsDefaultTrue(user).ifPresent(s -> {
                s.setDefault(false);
                signatureRepository.save(s);
            });
        }

        Signature signature = new Signature();
        signature.setUser(user);
        signature.setSignatureData(data);
        signature.setSignatureType(type);
        signature.setDefault(setAsDefault);
        return signatureRepository.save(signature);
    }
}
