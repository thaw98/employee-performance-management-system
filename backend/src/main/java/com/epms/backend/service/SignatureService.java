package com.epms.backend.service;

import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import com.epms.backend.repository.SignatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SignatureService {

    private final SignatureRepository signatureRepository;
    private final SignatureStorageService signatureStorageService;

    @Transactional(readOnly = true)
    public List<Signature> getUserSignatures(User user) {
        return signatureRepository.findByUser(user);
    }

    @Transactional(readOnly = true)
    public Optional<Signature> getDefaultSignature(User user) {
        return signatureRepository.findByUserAndIsDefaultTrue(user);
    }

    @Transactional
    public Signature saveDrawnSignature(User user, String signaturePngDataUrl) {
        String path = signatureStorageService.storeDrawnPng(signaturePngDataUrl);
        return saveSignature(user, path, "DRAWN_PNG");
    }

    @Transactional
    public Signature saveUploadedSignature(User user, MultipartFile file) {
        String path = signatureStorageService.storeUploadedImage(file);
        return saveSignature(user, path, "UPLOADED_IMAGE");
    }

    private Signature saveSignature(User user, String path, String type) {
        Signature signature = new Signature();
        signature.setUser(user);
        signature.setSignatureData(path);
        signature.setSignatureType(type);
        long count = signatureRepository.countByUser(user);
        if (count == 0) {
            signature.setDefault(true);
        }
        return signatureRepository.save(signature);
    }

    @Transactional
    public Signature setDefaultSignature(User user, Long signatureId) {
        Signature signature = signatureRepository.findByIdAndUser(signatureId, user)
                .orElseThrow(() -> new IllegalArgumentException("Signature not found"));
        if (signature.isDefault()) {
            return signature;
        }
        signatureRepository.clearDefaultForUser(user);
        signature.setDefault(true);
        return signatureRepository.save(signature);
    }

    @Transactional
    public void deleteSignature(User user, Long signatureId) {
        long count = signatureRepository.countByUser(user);
        if (count <= 1) {
            throw new IllegalArgumentException("Cannot delete the last signature");
        }
        Signature signature = signatureRepository.findByIdAndUser(signatureId, user)
                .orElseThrow(() -> new IllegalArgumentException("Signature not found"));
        boolean wasDefault = signature.isDefault();
        signatureStorageService.deleteFile(signature.getSignatureData());
        signatureRepository.delete(signature);
        if (wasDefault) {
            signatureRepository.findByUser(user).stream().findFirst().ifPresent(first -> {
                first.setDefault(true);
                signatureRepository.save(first);
            });
        }
    }
}
