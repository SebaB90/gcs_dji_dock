import { useState, useEffect } from "react";
import missionService from "../../services/mission.service";
import {
    Activity,
    Clock,
    Calendar,
    MapPin
} from "lucide-react";
import "./MissionStatusPanel.css";

export default function MissionStatusPanel() {
    const [schedules, setSchedules] = useState([]);
    const [activeExecutions, setActiveExecutions] = useState([]);
    const [countdowns, setCountdowns] = useState({});

    // Fetch scheduled missions and active executions
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const data = await missionService.getSchedules();
                // Backend returns array directly with mission data included
                const scheduleArray = Array.isArray(data) ? data : [];

                // Filter enabled schedules with future execution times and sort by next_execution
                const activeSchedules = scheduleArray
                    .filter(s => s.enabled && s.next_execution)
                    .sort((a, b) => new Date(a.next_execution) - new Date(b.next_execution));

                setSchedules(activeSchedules);

                // No need to fetch missions separately - they're included in schedule.mission
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };

        const fetchActiveExecutions = async () => {
            try {
                const data = await missionService.getActiveExecutions();
                const executionsArray = Array.isArray(data) ? data : [];
                setActiveExecutions(executionsArray);
            } catch (err) {
                console.error("Error fetching active executions:", err);
            }
        };

        fetchSchedules();
        fetchActiveExecutions();
        const interval = setInterval(() => {
            fetchSchedules();
            fetchActiveExecutions();
        }, 5000); // Refresh every 5 seconds for real-time updates
        return () => clearInterval(interval);
    }, []);

    // Update countdowns every second
    useEffect(() => {
        const updateCountdowns = () => {
            const newCountdowns = {};
            schedules.forEach(schedule => {
                if (schedule.next_execution) {
                    const now = new Date();
                    const nextExec = new Date(schedule.next_execution);
                    const diff = nextExec - now;

                    if (diff > 0) {
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        newCountdowns[schedule.id] = { hours, minutes, seconds, diff };
                    } else {
                        newCountdowns[schedule.id] = { hours: 0, minutes: 0, seconds: 0, diff: 0 };
                    }
                }
            });
            setCountdowns(newCountdowns);
        };

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [schedules]);

    return (
        <div className="mission-status-panel">
            <h3 className="mission-status-header">
                <Calendar size={18} />
                Scheduled Missions
            </h3>

            {schedules.length === 0 && activeExecutions.length === 0 ? (
                <div className="no-missions-placeholder">
                    <Calendar size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <div>No missions scheduled or executing</div>
                </div>
            ) : (
                <div className="missions-list">
                    {/* Show active executions first */}
                    {activeExecutions.map((execution) => {
                        const mission = execution.mission;
                        const startTime = new Date(execution.started_at);
                        const elapsed = Math.floor((new Date() - startTime) / 1000); // seconds
                        const elapsedMin = Math.floor(elapsed / 60);
                        const elapsedSec = elapsed % 60;

                        return (
                            <div key={`exec-${execution.id}`} className="mission-card executing">
                                <div className="mission-badge executing-badge">
                                    EXECUTING
                                </div>

                                <div className="mission-header">
                                    <Activity size={16} color="#4ade80" className="spin-icon" />
                                    <span className="mission-name">
                                        {mission?.name || `Mission #${execution.mission_id}`}
                                    </span>
                                </div>

                                <div className="mission-time">
                                    <Clock size={14} color="#4ade80" />
                                    <span className="countdown-display executing-time">
                                        {elapsedMin.toString().padStart(2, '0')}:{elapsedSec.toString().padStart(2, '0')} elapsed
                                    </span>
                                </div>

                                {mission && (
                                    <div className="mission-details">
                                        <span>Waypoints: {mission.waypoints?.length || 0}</span>
                                        <span>Speed: {mission.speed || 'N/A'} m/s</span>
                                        <span>Type: {execution.execution_type}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Then show scheduled missions */}
                    {schedules.map((schedule, idx) => {
                        const mission = schedule.mission; // Read directly from schedule
                        const countdown = countdowns[schedule.id];

                        return (
                            <div key={schedule.id} className={`mission-card ${idx === 0 ? 'next-mission' : ''}`}>
                                {idx === 0 && (
                                    <div className="mission-badge next-badge">
                                        NEXT
                                    </div>
                                )}

                                <div className="mission-header">
                                    <MapPin size={16} color="#79a7ff" />
                                    <span className="mission-name">
                                        {mission?.name || `Mission #${schedule.mission_id}`}
                                    </span>
                                </div>

                                {countdown && (
                                    <div className="mission-time">
                                        <Clock size={14} color="#aaa" />
                                        <span className={`countdown-display ${idx === 0 ? 'next-time' : ''}`}>
                                            {countdown.hours.toString().padStart(2, '0')}:
                                            {countdown.minutes.toString().padStart(2, '0')}:
                                            {countdown.seconds.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                )}

                                {mission && (
                                    <div className="mission-details">
                                        <span>Waypoints: {mission.waypoints?.length || 0}</span>
                                        <span>Speed: {mission.speed || 'N/A'} m/s</span>
                                        <span>Type: {schedule.schedule_type}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
