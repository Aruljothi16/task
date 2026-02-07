<?php
require_once __DIR__ . '/../config/database.php';

class Task {
    private $conn;
    private $table_name = "tasks";

    public $id;
    public $title;
    public $description;
    public $project_id;
    public $assigned_to;
    public $assigned_by;
    public $status;
    public $priority;
    public $due_date;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (title, description, project_id, assigned_to, assigned_by, status, priority, due_date) 
                  VALUES (:title, :description, :project_id, :assigned_to, :assigned_by, :status, :priority, :due_date)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":project_id", $this->project_id);
        $stmt->bindParam(":assigned_to", $this->assigned_to);
        $stmt->bindParam(":assigned_by", $this->assigned_by);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":priority", $this->priority);
        $stmt->bindParam(":due_date", $this->due_date);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = :status, updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    public function getByUser($user_id) {
        $query = "SELECT t.*, p.name as project_name, 
                         u1.full_name as assigned_to_name,
                         u1.designation as assigned_to_designation,
                         u2.full_name as assigned_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN projects p ON t.project_id = p.id
                  LEFT JOIN users u1 ON t.assigned_to = u1.id
                  LEFT JOIN users u2 ON t.assigned_by = u2.id
                  WHERE t.assigned_to = :user_id 
                  ORDER BY t.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getByProject($project_id) {
        $query = "SELECT t.*, 
                         u1.full_name as assigned_to_name,
                         u1.designation as assigned_to_designation,
                         u2.full_name as assigned_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN users u1 ON t.assigned_to = u1.id
                  LEFT JOIN users u2 ON t.assigned_by = u2.id
                  WHERE t.project_id = :project_id 
                  ORDER BY t.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":project_id", $project_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getAll() {
        $query = "SELECT t.*, p.name as project_name,
                         u1.full_name as assigned_to_name,
                         u1.designation as assigned_to_designation,
                         u2.full_name as assigned_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN projects p ON t.project_id = p.id
                  LEFT JOIN users u1 ON t.assigned_to = u1.id
                  LEFT JOIN users u2 ON t.assigned_by = u2.id
                  ORDER BY t.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function findById($id) {
        $query = "SELECT t.*, p.name as project_name,
                         u1.full_name as assigned_to_name,
                         u1.designation as assigned_to_designation,
                         u2.full_name as assigned_by_name
                  FROM " . $this->table_name . " t
                  LEFT JOIN projects p ON t.project_id = p.id
                  LEFT JOIN users u1 ON t.assigned_to = u1.id
                  LEFT JOIN users u2 ON t.assigned_by = u2.id
                  WHERE t.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }
}
?>







