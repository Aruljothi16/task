<?php

class AIService {
    private static $base_url = "http://127.0.0.1:8000";

    /**
     * Predict task priority based on title and description
     */
    public static function predictPriority($title, $description, $context = []) {
        $data = [
            "title" => $title,
            "description" => $description,
            "project_id" => $context['project_id'] ?? null,
            "due_date" => $context['due_date'] ?? null,
            "estimated_hours" => $context['estimated_hours'] ?? null,
            "task_type" => $context['task_type'] ?? null,
            "dependencies" => $context['dependencies'] ?? []
        ];

        return self::post("/predict/priority", $data);
    }

    /**
     * Analyze workload for a team
     */
    public static function analyzeWorkload($members, $tasks) {
        $data = [
            "members" => $members,
            "tasks" => $tasks
        ];

        return self::post("/analyze/workload", $data);
    }

    /**
     * Get AI chat response
     */
    public static function chat($message, $role, $user_id = null, $user_name = null) {
        $data = [
            "message" => $message,
            "role" => $role,
            "user_id" => $user_id,
            "user_name" => $user_name
        ];

        return self::post("/chat", $data);
    }


    /**
     * Generate subtasks for a task
     */
    public static function generateSubtasks($title, $description = "") {
        return self::post("/generate/subtasks", [
            "title" => $title,
            "description" => $description
        ]);
    }


    /**
     * Predict risk of delay
     */
    public static function predictDelay($tasks_count, $complexity = "medium") {
        $data = ["tasks_count" => $tasks_count, "complexity" => $complexity];
        return self::post("/predict/delay", $data);
    }

    /**
     * Analyze team mood from comments
     */
    public static function analyzeSentiment($comments) {
        return self::post("/analyze/sentiment", ["comments" => $comments]);
    }

    /**
     * Analyze Cogntive Complexity for a Member
     */
    public static function analyzeComplexity($title, $description) {
        return self::post("/analyze/complexity", ["title" => $title, "description" => $description]);
    }

    /**
     * Analyze Project Inertia for Admin
     */
    public static function analyzeInertia($projects) {
        return self::post("/analyze/inertia", ["projects" => $projects]);
    }

    /**
     * Generic POST request helper
     */
    private static function post($endpoint, $data) {
        try {
            $url = self::$base_url . $endpoint;
            $ch = curl_init($url);
            $payload = json_encode($data);
            
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_POST, true); // Explicitly set POST
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5); 
            
            $response = curl_exec($ch);
            $errno = curl_errno($ch);
            $error = curl_error($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($errno) {
                error_log("AI Service Connection Error to $url ($errno): $error");
                return null;
            }

            if ($http_code !== 200) {
                error_log("AI Service returned HTTP $http_code for $endpoint. Response: " . $response);
                return null;
            }

            return json_decode($response, true);
        } catch (Exception $e) {
            error_log("AI Service Exception: " . $e->getMessage());
            return null;
        }
    }
}
