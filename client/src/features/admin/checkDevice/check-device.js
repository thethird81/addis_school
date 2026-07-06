function generateDeviceId() {
    // Use only stable identifiers (exclude version info)
    const deviceFingerprint = `${navigator.language}-${navigator.hardwareConcurrency}-${navigator.platform}`;
    
    // Simple hash function for consistent ID
    const deviceId = hashCode(deviceFingerprint);
    console.log('Generated Device ID:', deviceId);
    return deviceId;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

generateDeviceId();