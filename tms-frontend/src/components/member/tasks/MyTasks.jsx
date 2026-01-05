import React, { useState, useEffect } from 'react';
import { memberService } from '../../../services/memberService';
import Loader from '../../common/Loader';
import TaskCard from '../../shared/TaskCard';
import { useNavigate } from 'react-router-dom';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await memberService.getMyTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    navigate(`/member/tasks/${task.id}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="content">
      <h1>My Tasks</h1>
      {tasks.length === 0 ? (
        <div className="card">
          <p>No tasks assigned to you.</p>
        </div>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleTaskClick(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;





