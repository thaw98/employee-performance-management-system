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
        return saveNewDefaultSignature(user, path, "DRAWN_PNG");
    }

    @Transactional
    public Signature saveUploadedSignature(User user, MultipartFile file) {
        String path = signatureStorageService.storeUploadedImage(file);
        return saveNewDefaultSignature(user, path, "UPLOADED_IMAGE");
    }

    private Signature saveNewDefaultSignature(User user, String path, String type) {
        signatureRepository.clearDefaultForUser(user);
        Signature signature = new Signature();
        signature.setUser(user);
        signature.setSignatureData(path);
        signature.setSignatureType(type);
        signature.setDefault(true);
        return signatureRepository.save(signature);
    }
}
