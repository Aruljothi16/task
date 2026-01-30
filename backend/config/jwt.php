<?php
// JWT Configuration and Helper Functions
class JWT {
    private static $secret_key = "your-secret-key-change-in-production";
    private static $algorithm = "HS256";

    public static function encode($payload) {
        $header = [
            "typ" => "JWT",
            "alg" => self::$algorithm
        ];

        $header_encoded = self::base64UrlEncode(json_encode($header));
        $payload_encoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac(
            "sha256",
            $header_encoded . "." . $payload_encoded,
            self::$secret_key,
            true
        );
        $signature_encoded = self::base64UrlEncode($signature);

        return $header_encoded . "." . $payload_encoded . "." . $signature_encoded;
    }

    public static function decode($token) {
        $parts = explode(".", $token);
        
        if (count($parts) !== 3) {
            return null;
        }

        list($header_encoded, $payload_encoded, $signature_encoded) = $parts;

        $signature = self::base64UrlDecode($signature_encoded);
        $expected_signature = hash_hmac(
            "sha256",
            $header_encoded . "." . $payload_encoded,
            self::$secret_key,
            true
        );

        if (!hash_equals($signature, $expected_signature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payload_encoded), true);
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>






