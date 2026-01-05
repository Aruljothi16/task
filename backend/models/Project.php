<?php
require_once __DIR__ . '/../config/database.php';

class Project {
    private $conn;
    private $table_name = "projects";

    public $id;
    public $name;
    public $description;
    public $manager_id;
    public $status;
    public $start_date;
    public $due_date;
    public $priority;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (name, description, manager_id, status, start_date, due_date, priority) 
                  VALUES (:name, :description, :manager_id, :status, :start_date, :due_date, :priority)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":manager_id", $this->manager_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":priority", $this->priority);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET name = :name, 
                      description = :description, 
                      manager_id = :manager_id, 
                      status = :status,
                      start_date = :start_date,
                      due_date = :due_date,
                      priority = :priority
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":manager_id", $this->manager_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":start_date", $this->start_date);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":priority", $this->priority);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    public function getByManager($manager_id) {
        $query = "SELECT p.*, u.full_name as manager_name 
                  FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.manager_id = u.id
                  WHERE p.manager_id = :manager_id 
                  ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":manager_id", $manager_id);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getAll() {
        $query = "SELECT p.*, u.full_name as manager_name 
                  FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.manager_id = u.id
                  ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function findById($id) {
        $query = "SELECT p.*, u.full_name as manager_name 
                  FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.manager_id = u.id
                  WHERE p.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        return $stmt->fetch();
    }
}
?>





