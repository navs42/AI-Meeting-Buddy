import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { Task } from '../types';
import { TrashIcon } from '../components/Icons';

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const { dispatch } = useAppContext();

    const handleToggle = async () => {
        const updatedTask = { ...task, completed: !task.completed };
        const result = await api.updateTask(updatedTask);
        dispatch({ type: 'UPDATE_TASK', payload: result });
    };

    const handleDelete = async () => {
        await api.deleteTask(task.id);
        dispatch({ type: 'DELETE_TASK', payload: task.id });
    };

    return (
        <div className="group flex items-center justify-between p-3 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={handleToggle}
                    className="h-5 w-5 rounded border-neutral-300 bg-white text-primary focus:ring-primary cursor-pointer"
                />
                <span className={`ml-3 text-neutral-800 transition-all duration-300 ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                    {task.text}
                </span>
            </div>
            <button onClick={handleDelete} className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const TasksPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask = await api.addTask(newTaskText);
        dispatch({ type: 'ADD_TASK', payload: newTask });
        setNewTaskText('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
                    <Input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                    />
                    <Button type="submit">Add Task</Button>
                </form>
                <div className="space-y-2">
                    {state.tasks.map(task => <TaskItem key={task.id} task={task} />)}
                </div>
            </CardContent>
        </Card>
    );
};

export default TasksPage;